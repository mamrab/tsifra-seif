use std::path::{Path, PathBuf};
use std::sync::Mutex;
use chrono::Utc;
use zeroize::Zeroizing;

use crate::crypto::kdf::{derive_key, generate_salt, KEY_LEN, SALT_LEN};
use crate::storage::vault_file::{StorageError, VaultStorage};
use crate::vault::models::{VaultData, VaultItem, VaultSettings, VaultStatus};

#[derive(Debug, thiserror::Error)]
pub enum VaultManagerError {
    #[error("Storage error: {0}")]
    Storage(#[from] StorageError),
    #[error("Vault is locked")]
    VaultLocked,
    #[error("Vault is already initialized")]
    AlreadyInitialized,
    #[error("Vault is not initialized yet")]
    NotInitialized,
    #[error("Item not found with id: {0}")]
    ItemNotFound(String),
    #[error("Invalid password provided")]
    InvalidPassword,
}

pub struct UnlockedSession {
    pub key: Zeroizing<[u8; KEY_LEN]>,
    pub salt: [u8; SALT_LEN],
    pub data: VaultData,
}

pub struct VaultManager {
    storage: VaultStorage,
    session: Mutex<Option<UnlockedSession>>,
}

impl VaultManager {
    pub fn new(vault_file_path: PathBuf) -> Self {
        Self {
            storage: VaultStorage::new(vault_file_path),
            session: Mutex::new(None),
        }
    }

    pub fn get_path(&self) -> &Path {
        self.storage.get_path()
    }

    pub fn is_initialized(&self) -> bool {
        self.storage.exists()
    }

    pub fn is_unlocked(&self) -> bool {
        let guard = self.session.lock().unwrap();
        guard.is_some()
    }

    pub fn status(&self) -> VaultStatus {
        let is_init = self.is_initialized();
        let guard = self.session.lock().unwrap();

        if let Some(ref session) = *guard {
            VaultStatus {
                is_initialized: is_init,
                is_unlocked: true,
                item_count: session.data.items.len(),
                categories: session.data.categories.clone(),
                auto_lock_minutes: session.data.settings.auto_lock_minutes,
                biometrics_enabled: session.data.settings.biometrics_enabled,
                last_modified: Some(session.data.updated_at),
            }
        } else {
            VaultStatus {
                is_initialized: is_init,
                is_unlocked: false,
                item_count: 0,
                categories: vec![
                    "Общие".to_string(),
                    "Соцсети".to_string(),
                    "Финансы".to_string(),
                    "Работа".to_string(),
                    "Личное".to_string(),
                ],
                auto_lock_minutes: 5,
                biometrics_enabled: false,
                last_modified: None,
            }
        }
    }

    pub fn initialize(&self, master_password: &str) -> Result<VaultStatus, VaultManagerError> {
        if self.is_initialized() {
            return Err(VaultManagerError::AlreadyInitialized);
        }

        let initial_data = VaultData::default();
        let salt = generate_salt();
        let key = derive_key(master_password, &salt)
            .map_err(|e| StorageError::Kdf(e.to_string()))?;

        self.storage.save_with_key_and_salt(&key, &salt, &initial_data)?;

        let mut guard = self.session.lock().unwrap();
        *guard = Some(UnlockedSession {
            key,
            salt,
            data: initial_data,
        });

        Ok(self.status())
    }

    pub fn unlock(&self, master_password: &str) -> Result<VaultStatus, VaultManagerError> {
        if !self.is_initialized() {
            return Err(VaultManagerError::NotInitialized);
        }

        let (key, salt, data) = self.storage.unlock(master_password)?;

        let mut guard = self.session.lock().unwrap();
        *guard = Some(UnlockedSession { key, salt, data });

        Ok(self.status())
    }

    pub fn lock(&self) {
        let mut guard = self.session.lock().unwrap();
        // Dropping UnlockedSession securely zeroizes the key buffer
        *guard = None;
    }

    pub fn get_items(&self) -> Result<Vec<VaultItem>, VaultManagerError> {
        let guard = self.session.lock().unwrap();
        match *guard {
            Some(ref session) => Ok(session.data.items.clone()),
            None => Err(VaultManagerError::VaultLocked),
        }
    }

    pub fn get_item(&self, id: &str) -> Result<VaultItem, VaultManagerError> {
        let guard = self.session.lock().unwrap();
        match *guard {
            Some(ref session) => session
                .data
                .items
                .iter()
                .find(|it| it.id == id)
                .cloned()
                .ok_or_else(|| VaultManagerError::ItemNotFound(id.to_string())),
            None => Err(VaultManagerError::VaultLocked),
        }
    }

    pub fn save_item(&self, mut item: VaultItem) -> Result<VaultItem, VaultManagerError> {
        let mut guard = self.session.lock().unwrap();
        let session = guard.as_mut().ok_or(VaultManagerError::VaultLocked)?;

        let now = Utc::now().timestamp_millis();
        item.updated_at = now;

        if let Some(pos) = session.data.items.iter().position(|it| it.id == item.id) {
            session.data.items[pos] = item.clone();
        } else {
            if item.created_at == 0 {
                item.created_at = now;
            }
            session.data.items.push(item.clone());
        }

        session.data.updated_at = now;

        // Persist immediately
        self.storage
            .save_with_key_and_salt(&session.key, &session.salt, &session.data)?;

        Ok(item)
    }

    pub fn delete_item(&self, id: &str) -> Result<(), VaultManagerError> {
        let mut guard = self.session.lock().unwrap();
        let session = guard.as_mut().ok_or(VaultManagerError::VaultLocked)?;

        let initial_len = session.data.items.len();
        session.data.items.retain(|it| it.id != id);

        if session.data.items.len() == initial_len {
            return Err(VaultManagerError::ItemNotFound(id.to_string()));
        }

        session.data.updated_at = Utc::now().timestamp_millis();
        self.storage
            .save_with_key_and_salt(&session.key, &session.salt, &session.data)?;

        Ok(())
    }

    pub fn update_settings(&self, settings: VaultSettings) -> Result<(), VaultManagerError> {
        let mut guard = self.session.lock().unwrap();
        let session = guard.as_mut().ok_or(VaultManagerError::VaultLocked)?;

        session.data.settings = settings;
        session.data.updated_at = Utc::now().timestamp_millis();

        self.storage
            .save_with_key_and_salt(&session.key, &session.salt, &session.data)?;

        Ok(())
    }

    pub fn change_master_password(
        &self,
        old_password: &str,
        new_password: &str,
    ) -> Result<(), VaultManagerError> {
        // 1. Verify old password by attempting unlock/derivation
        let (_, _, current_data) = self
            .storage
            .unlock(old_password)
            .map_err(|_| VaultManagerError::InvalidPassword)?;

        // 2. Generate brand new salt and derive new key
        let new_salt = generate_salt();
        let new_key = derive_key(new_password, &new_salt)
            .map_err(|e| StorageError::Kdf(e.to_string()))?;

        // 3. Save with new credentials
        self.storage
            .save_with_key_and_salt(&new_key, &new_salt, &current_data)?;

        // 4. Update current session if already unlocked
        let mut guard = self.session.lock().unwrap();
        if guard.is_some() {
            *guard = Some(UnlockedSession {
                key: new_key,
                salt: new_salt,
                data: current_data,
            });
        }

        Ok(())
    }

    pub fn export_raw_backup(&self) -> Result<Vec<u8>, VaultManagerError> {
        let backup = self.storage.export_raw_backup()?;
        Ok(backup)
    }

    pub fn import_raw_backup(
        &self,
        backup_bytes: &[u8],
        test_password: &str,
    ) -> Result<VaultStatus, VaultManagerError> {
        // Write to a temporary check storage to verify it can be decrypted with password
        let dir = tempfile::tempdir().map_err(|e| StorageError::Io(e))?;
        let test_vault_path = dir.path().join("check_vault.enc");
        let test_storage = VaultStorage::new(&test_vault_path);
        test_storage.import_raw_backup(backup_bytes)?;

        // Try unlocking test storage
        let (key, salt, data) = test_storage
            .unlock(test_password)
            .map_err(|_| VaultManagerError::InvalidPassword)?;

        // Success: write to real storage
        self.storage.import_raw_backup(backup_bytes)?;

        // Update active session
        let mut guard = self.session.lock().unwrap();
        *guard = Some(UnlockedSession { key, salt, data });

        Ok(self.status())
    }
}
