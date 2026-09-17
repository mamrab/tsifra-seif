use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zeroize::Zeroizing;

use crate::crypto::cipher::{decrypt_aes_gcm, encrypt_aes_gcm, NONCE_LEN};
use crate::crypto::kdf::{derive_key, generate_salt, KEY_LEN, SALT_LEN};
use crate::vault::models::VaultData;

const MAGIC: &[u8; 4] = b"TSRF";
const CURRENT_FILE_VERSION: u16 = 1;
const HEADER_LEN: usize = 4 + 2 + SALT_LEN + NONCE_LEN; // 4 + 2 + 16 + 12 = 34 bytes

#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Invalid magic header: file is not a valid Tsifra-Seif vault")]
    InvalidMagic,
    #[error("Unsupported file version: {0}")]
    UnsupportedVersion(u16),
    #[error("Vault file is too short: {0} bytes")]
    FileTooShort(usize),
    #[error("Decryption error: invalid master password or corrupted vault file")]
    DecryptionFailed,
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("Key derivation error: {0}")]
    Kdf(String),
}

/// Encapsulates reading, writing, and atomic persistence of the encrypted vault container file.
pub struct VaultStorage {
    file_path: PathBuf,
}

impl VaultStorage {
    pub fn new<P: AsRef<Path>>(file_path: P) -> Self {
        Self {
            file_path: file_path.as_ref().to_path_buf(),
        }
    }

    pub fn exists(&self) -> bool {
        self.file_path.exists()
    }

    pub fn get_path(&self) -> &Path {
        &self.file_path
    }

    /// Creates and writes a newly initialized vault with the given master password.
    /// Returns the derived key for in-memory session use.
    pub fn initialize(
        &self,
        master_password: &str,
        initial_data: &VaultData,
    ) -> Result<Zeroizing<[u8; KEY_LEN]>, StorageError> {
        let salt = generate_salt();
        let key = derive_key(master_password, &salt)
            .map_err(|e| StorageError::Kdf(e.to_string()))?;

        self.save_with_key_and_salt(&key, &salt, initial_data)?;
        Ok(key)
    }

    /// Reads and decrypts the vault from disk with the provided master password.
    /// Returns both the derived key (for subsequent in-memory saves) and the decrypted `VaultData`.
    pub fn unlock(
        &self,
        master_password: &str,
    ) -> Result<(Zeroizing<[u8; KEY_LEN]>, [u8; SALT_LEN], VaultData), StorageError> {
        let mut file = File::open(&self.file_path)?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;

        if buffer.len() < HEADER_LEN {
            return Err(StorageError::FileTooShort(buffer.len()));
        }

        // 1. Verify Magic
        if &buffer[0..4] != MAGIC {
            return Err(StorageError::InvalidMagic);
        }

        // 2. Read Version
        let version = u16::from_be_bytes([buffer[4], buffer[5]]);
        if version != CURRENT_FILE_VERSION {
            return Err(StorageError::UnsupportedVersion(version));
        }

        // 3. Extract Salt & Nonce
        let mut salt = [0u8; SALT_LEN];
        salt.copy_from_slice(&buffer[6..6 + SALT_LEN]);

        let mut nonce = [0u8; NONCE_LEN];
        let nonce_start = 6 + SALT_LEN;
        nonce.copy_from_slice(&buffer[nonce_start..nonce_start + NONCE_LEN]);

        let ciphertext = &buffer[HEADER_LEN..];

        // 4. Derive key via Argon2id
        let key = derive_key(master_password, &salt)
            .map_err(|e| StorageError::Kdf(e.to_string()))?;

        // 5. Decrypt using AES-256-GCM
        let decrypted_bytes = decrypt_aes_gcm(&key, &nonce, ciphertext)
            .map_err(|_| StorageError::DecryptionFailed)?;

        // 6. Deserialize Vault JSON
        let vault_data: VaultData = serde_json::from_slice(&decrypted_bytes)?;

        Ok((key, salt, vault_data))
    }

    /// Encrypts and writes vault data atomically using the existing session key and salt.
    pub fn save_with_key_and_salt(
        &self,
        key: &[u8; KEY_LEN],
        salt: &[u8; SALT_LEN],
        vault_data: &VaultData,
    ) -> Result<(), StorageError> {
        let serialized = serde_json::to_vec(vault_data)?;
        let (nonce, ciphertext) = encrypt_aes_gcm(key, &serialized)
            .map_err(|_| StorageError::DecryptionFailed)?;

        // Build file buffer: MAGIC (4) + VERSION (2) + SALT (16) + NONCE (12) + CIPHERTEXT
        let mut file_bytes = Vec::with_capacity(HEADER_LEN + ciphertext.len());
        file_bytes.extend_from_slice(MAGIC);
        file_bytes.extend_from_slice(&CURRENT_FILE_VERSION.to_be_bytes());
        file_bytes.extend_from_slice(salt);
        file_bytes.extend_from_slice(&nonce);
        file_bytes.extend_from_slice(&ciphertext);

        // Ensure parent directory exists
        if let Some(parent) = self.file_path.parent() {
            fs::create_dir_all(parent)?;
        }

        // Write to temporary file first for atomic safety
        let tmp_path = self.file_path.with_extension("tmp");
        {
            let mut tmp_file = File::create(&tmp_path)?;
            tmp_file.write_all(&file_bytes)?;
            tmp_file.flush()?;
            tmp_file.sync_all()?;
        }

        // Atomic replace
        fs::rename(&tmp_path, &self.file_path)?;

        Ok(())
    }

    /// Exports the entire raw encrypted file content into a standalone backup byte vector
    pub fn export_raw_backup(&self) -> Result<Vec<u8>, StorageError> {
        let mut file = File::open(&self.file_path)?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;
        Ok(buffer)
    }

    /// Imports a raw encrypted backup container after checking header and structure
    pub fn import_raw_backup(&self, backup_data: &[u8]) -> Result<(), StorageError> {
        if backup_data.len() < HEADER_LEN {
            return Err(StorageError::FileTooShort(backup_data.len()));
        }
        if &backup_data[0..4] != MAGIC {
            return Err(StorageError::InvalidMagic);
        }

        if let Some(parent) = self.file_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let tmp_path = self.file_path.with_extension("import_tmp");
        {
            let mut tmp_file = File::create(&tmp_path)?;
            tmp_file.write_all(backup_data)?;
            tmp_file.flush()?;
            tmp_file.sync_all()?;
        }
        fs::rename(&tmp_path, &self.file_path)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::models::VaultItem;
    use tempfile::tempdir;

    #[test]
    fn test_vault_storage_roundtrip() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault.enc");
        let storage = VaultStorage::new(&vault_path);

        assert!(!storage.exists());

        let mut initial_data = VaultData::default();
        let mut item = VaultItem::new("GitHub".to_string(), crate::vault::models::VaultItemType::Password, "Работа".to_string());
        item.username = Some("user@example.com".to_string());
        item.password = Some("Sup3r$ecr3tP@ss!".to_string());
        initial_data.items.push(item);

        let master_pass = "StrongMasterPass123!";
        let (_key, _salt) = {
            let s = generate_salt();
            let k = derive_key(master_pass, &s).unwrap();
            storage.save_with_key_and_salt(&k, &s, &initial_data).unwrap();
            (k, s)
        };

        assert!(storage.exists());

        // Unlock with correct password
        let (_unlocked_key, _unlocked_salt, loaded_data) = storage.unlock(master_pass).unwrap();
        assert_eq!(loaded_data.items.len(), 1);
        assert_eq!(loaded_data.items[0].title, "GitHub");
        assert_eq!(loaded_data.items[0].password.as_deref(), Some("Sup3r$ecr3tP@ss!"));

        // Unlock with wrong password must fail
        let wrong_result = storage.unlock("WrongPassword!");
        assert!(wrong_result.is_err());
    }
}
