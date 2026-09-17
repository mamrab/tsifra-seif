use argon2::{Algorithm, Argon2, Params, Version};
use rand::rngs::OsRng;
use rand::RngCore;
use zeroize::Zeroizing;

pub const SALT_LEN: usize = 16;
pub const KEY_LEN: usize = 32; // 256-bit AES key

#[derive(Debug, thiserror::Error)]
pub enum KdfError {
    #[error("Argon2 error: {0}")]
    Argon2(String),
}

/// Generates a cryptographically secure random 16-byte salt
pub fn generate_salt() -> [u8; SALT_LEN] {
    let mut salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);
    salt
}

/// Derives a 256-bit encryption key from a master PIN/password and salt using Argon2id.
/// Balanced parameters: 64 MB memory (m_cost = 65536), 3 iterations (t_cost = 3), 1 lane (p_cost = 1).
/// These parameters provide strong resistance against GPU/ASIC attacks while remaining fast and smooth
/// on mobile (iOS/Android) and desktop devices.
pub fn derive_key(password: &str, salt: &[u8; SALT_LEN]) -> Result<Zeroizing<[u8; KEY_LEN]>, KdfError> {
    let params = Params::new(65536, 3, 1, Some(KEY_LEN))
        .map_err(|e| KdfError::Argon2(e.to_string()))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    let mut key = Zeroizing::new([0u8; KEY_LEN]);
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut *key)
        .map_err(|e| KdfError::Argon2(e.to_string()))?;

    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kdf_deterministic() {
        let salt = [7u8; SALT_LEN];
        let key1 = derive_key("my_master_password_123", &salt).unwrap();
        let key2 = derive_key("my_master_password_123", &salt).unwrap();
        assert_eq!(*key1, *key2);
    }

    #[test]
    fn test_kdf_different_passwords_differ() {
        let salt = [7u8; SALT_LEN];
        let key1 = derive_key("password_a", &salt).unwrap();
        let key2 = derive_key("password_b", &salt).unwrap();
        assert_ne!(*key1, *key2);
    }

    #[test]
    fn test_kdf_different_salts_differ() {
        let salt1 = [1u8; SALT_LEN];
        let salt2 = [2u8; SALT_LEN];
        let key1 = derive_key("same_password", &salt1).unwrap();
        let key2 = derive_key("same_password", &salt2).unwrap();
        assert_ne!(*key1, *key2);
    }
}
