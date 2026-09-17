use std::path::{Path, PathBuf};
use std::sync::Mutex;
use chrono::Utc;
use zeroize::Zeroizing;

use crate::crypto::kdf::{derive_key, generate_salt, KEY_LEN, SALT_LEN};
use crate::storage::vault_file::{StorageError, VaultStorage};
use crate::vault::models::{DatabaseInfo, VaultData, VaultItem, VaultSettings, VaultStatus};

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
    #[error("Database name is invalid")]
    InvalidDatabaseName,
}

pub struct UnlockedSession {
    pub key: Zeroizing<[u8; KEY_LEN]>,
    pub salt: [u8; SALT_LEN],
    pub data: VaultData,
}

pub struct VaultManager {
    base_dir: PathBuf,
    current_db_name: Mutex<String>,
    storage: Mutex<VaultStorage>,
    session: Mutex<Option<UnlockedSession>>,
}

impl VaultManager {
    pub fn new(vault_file_path: PathBuf) -> Self {
        let base_dir = vault_file_path
            .parent()
            .unwrap_or_else(|| Path::new("."))
            .to_path_buf();

        let stem = vault_file_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("vault")
            .to_string();

        Self {
            base_dir,
            current_db_name: Mutex::new(stem),
            storage: Mutex::new(VaultStorage::new(vault_file_path)),
            session: Mutex::new(None),
        }
    }

    fn db_filename_for_name(name: &str) -> String {
        let clean = name.trim().to_lowercase().replace(' ', "_");
        let safe: String = clean
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
            .collect();
        if safe.is_empty() {
            "vault.enc".to_string()
        } else if safe.ends_with(".enc") {
            safe
        } else {
            format!("{}.enc", safe)
        }
    }

    pub fn get_current_db_name(&self) -> String {
        self.current_db_name.lock().unwrap().clone()
    }

    pub fn is_initialized(&self) -> bool {
        let storage = self.storage.lock().unwrap();
        storage.exists()
    }

    pub fn is_unlocked(&self) -> bool {
        let guard = self.session.lock().unwrap();
        guard.is_some()
    }

    pub fn status(&self) -> VaultStatus {
        let is_init = self.is_initialized();
        let guard = self.session.lock().unwrap();
        let db_name = self.get_current_db_name();

        if let Some(ref session) = *guard {
            VaultStatus {
                is_initialized: is_init,
                is_unlocked: true,
                item_count: session.data.items.len(),
                categories: session.data.categories.clone(),
                auto_lock_minutes: session.data.settings.auto_lock_minutes,
                biometrics_enabled: session.data.settings.biometrics_enabled,
                current_database: db_name,
                last_modified: Some(session.data.updated_at),
            }
        } else {
            VaultStatus {
                is_initialized: is_init,
                is_unlocked: false,
                item_count: 0,
                categories: vec![
                    "Общие".to_string(),
                    "Крипта".to_string(),
                    "Финансы".to_string(),
                    "Работа".to_string(),
                    "Соцсети".to_string(),
                    "Личное".to_string(),
                ],
                auto_lock_minutes: 5,
                biometrics_enabled: false,
                current_database: db_name,
                last_modified: None,
            }
        }
    }

    pub fn list_databases(&self) -> Result<Vec<DatabaseInfo>, VaultManagerError> {
        let mut list = Vec::new();
        let current = self.get_current_db_name();

        if let Ok(entries) = std::fs::read_dir(&self.base_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("enc") {
                    let filename = path.file_name().unwrap().to_string_lossy().to_string();
                    let name = path.file_stem().unwrap().to_string_lossy().to_string();
                    let metadata = entry.metadata().ok();
                    let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
                    let modified = metadata
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_millis() as i64)
                        .unwrap_or(0);

                    let is_curr = name == current || filename == format!("{}.enc", current);

                    list.push(DatabaseInfo {
                        name,
                        filename,
                        size_bytes: size,
                        is_current: is_curr,
                        updated_at: modified,
                    });
                }
            }
        }

        if list.is_empty() {
            list.push(DatabaseInfo {
                name: "vault".to_string(),
                filename: "vault.enc".to_string(),
                size_bytes: 0,
                is_current: true,
                updated_at: Utc::now().timestamp_millis(),
            });
        }

        Ok(list)
    }

    pub fn switch_database(&self, name: &str) -> Result<VaultStatus, VaultManagerError> {
        self.lock();

        let filename = Self::db_filename_for_name(name);
        let path = self.base_dir.join(&filename);
        let clean_name = path.file_stem().unwrap().to_string_lossy().to_string();

        {
            let mut db_guard = self.current_db_name.lock().unwrap();
            *db_guard = clean_name;
        }
        {
            let mut storage_guard = self.storage.lock().unwrap();
            *storage_guard = VaultStorage::new(path);
        }

        Ok(self.status())
    }

    pub fn create_database(&self, name: &str, password: &str) -> Result<VaultStatus, VaultManagerError> {
        self.lock();

        let filename = Self::db_filename_for_name(name);
        let path = self.base_dir.join(&filename);
        let clean_name = path.file_stem().unwrap().to_string_lossy().to_string();

        let new_storage = VaultStorage::new(path);
        let initial_data = VaultData::default();
        let key = new_storage.initialize(password, &initial_data)?;

        let salt = [0u8; SALT_LEN]; // will be reloaded or tracked

        {
            let mut db_guard = self.current_db_name.lock().unwrap();
            *db_guard = clean_name;
        }
        {
            let mut storage_guard = self.storage.lock().unwrap();
            *storage_guard = new_storage;
        }
        {
            let mut session_guard = self.session.lock().unwrap();
            *session_guard = Some(UnlockedSession {
                key,
                salt,
                data: initial_data,
            });
        }

        Ok(self.status())
    }

    pub fn initialize(&self, master_password: &str) -> Result<VaultStatus, VaultManagerError> {
        if self.is_initialized() {
            return Err(VaultManagerError::AlreadyInitialized);
        }

        let initial_data = VaultData::default();
        let storage = self.storage.lock().unwrap();
        let key = storage.initialize(master_password, &initial_data)?;
        let salt = [0u8; SALT_LEN];

        let mut guard = self.session.lock().unwrap();
        *guard = Some(UnlockedSession {
            key,
            salt,
            data: initial_data,
        });

        drop(storage);
        drop(guard);
        Ok(self.status())
    }

    pub fn unlock(&self, master_password: &str) -> Result<VaultStatus, VaultManagerError> {
        if !self.is_initialized() {
            return Err(VaultManagerError::NotInitialized);
        }

        let storage = self.storage.lock().unwrap();
        let (key, salt, data) = storage.unlock(master_password)?;

        let mut guard = self.session.lock().unwrap();
        *guard = Some(UnlockedSession { key, salt, data });

        drop(storage);
        drop(guard);
        Ok(self.status())
    }

    pub fn lock(&self) {
        let mut guard = self.session.lock().unwrap();
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

        let storage = self.storage.lock().unwrap();
        storage.save_with_key_and_salt(&session.key, &session.salt, &session.data)?;

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
        let storage = self.storage.lock().unwrap();
        storage.save_with_key_and_salt(&session.key, &session.salt, &session.data)?;

        Ok(())
    }

    pub fn update_settings(&self, settings: VaultSettings) -> Result<(), VaultManagerError> {
        let mut guard = self.session.lock().unwrap();
        let session = guard.as_mut().ok_or(VaultManagerError::VaultLocked)?;

        session.data.settings = settings;
        session.data.updated_at = Utc::now().timestamp_millis();

        let storage = self.storage.lock().unwrap();
        storage.save_with_key_and_salt(&session.key, &session.salt, &session.data)?;

        Ok(())
    }

    pub fn change_master_password(
        &self,
        old_password: &str,
        new_password: &str,
    ) -> Result<(), VaultManagerError> {
        let storage = self.storage.lock().unwrap();
        let (_, _, current_data) = storage
            .unlock(old_password)
            .map_err(|_| VaultManagerError::InvalidPassword)?;

        let new_salt = generate_salt();
        let new_key = derive_key(new_password, &new_salt)
            .map_err(|e| StorageError::Kdf(e.to_string()))?;

        storage.save_with_key_and_salt(&new_key, &new_salt, &current_data)?;

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
        let storage = self.storage.lock().unwrap();
        let backup = storage.export_raw_backup()?;
        Ok(backup)
    }

    pub fn import_raw_backup(
        &self,
        backup_bytes: &[u8],
        test_password: &str,
    ) -> Result<VaultStatus, VaultManagerError> {
        let dir = tempfile::tempdir().map_err(StorageError::Io)?;
        let test_vault_path = dir.path().join("check_vault.enc");
        let test_storage = VaultStorage::new(&test_vault_path);
        test_storage.import_raw_backup(backup_bytes)?;

        let (key, salt, data) = test_storage
            .unlock(test_password)
            .map_err(|_| VaultManagerError::InvalidPassword)?;

        let storage = self.storage.lock().unwrap();
        storage.import_raw_backup(backup_bytes)?;

        let mut guard = self.session.lock().unwrap();
        *guard = Some(UnlockedSession { key, salt, data });

        drop(storage);
        drop(guard);
        Ok(self.status())
    }
}
