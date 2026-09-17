use aes_gcm::aead::{Aead, AeadCore, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use rand::rngs::OsRng;
use zeroize::Zeroizing;

pub const NONCE_LEN: usize = 12; // 96-bit AES-GCM nonce

#[derive(Debug, thiserror::Error)]
pub enum CipherError {
    #[error("Encryption failed")]
    EncryptionFailed,
    #[error("Decryption failed: authentication tag mismatch or corrupted data")]
    DecryptionFailed,
}

/// Generates a random 96-bit nonce for AES-256-GCM
pub fn generate_nonce() -> [u8; NONCE_LEN] {
    Aes256Gcm::generate_nonce(&mut OsRng).into()
}

/// Encrypts plaintext bytes using AES-256-GCM.
/// Returns a tuple containing: (nonce, ciphertext_with_tag)
pub fn encrypt_aes_gcm(
    key: &[u8; 32],
    plaintext: &[u8],
) -> Result<([u8; NONCE_LEN], Vec<u8>), CipherError> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|_| CipherError::EncryptionFailed)?;
    let nonce_bytes = generate_nonce();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| CipherError::EncryptionFailed)?;

    Ok((nonce_bytes, ciphertext))
}

/// Decrypts ciphertext bytes with verification using AES-256-GCM.
/// Plaintext buffer is automatically wrapped in Zeroizing to safely clean sensitive data on drop.
pub fn decrypt_aes_gcm(
    key: &[u8; 32],
    nonce_bytes: &[u8; NONCE_LEN],
    ciphertext: &[u8],
) -> Result<Zeroizing<Vec<u8>>, CipherError> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|_| CipherError::DecryptionFailed)?;
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| CipherError::DecryptionFailed)?;

    Ok(Zeroizing::new(plaintext))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_aes_gcm_roundtrip() {
        let key = [42u8; 32];
        let original_data = "Tsifra-Seif top secret vault data with unicode: Привет, мир! 🔐".as_bytes();

        let (nonce, ciphertext) = encrypt_aes_gcm(&key, original_data).unwrap();
        assert_ne!(&ciphertext[..original_data.len()], original_data);

        let decrypted = decrypt_aes_gcm(&key, &nonce, &ciphertext).unwrap();
        assert_eq!(&*decrypted, original_data);
    }

    #[test]
    fn test_aes_gcm_tamper_detection() {
        let key = [42u8; 32];
        let data = b"Sensitive master password record";
        let (nonce, mut ciphertext) = encrypt_aes_gcm(&key, data).unwrap();

        // Tamper with one single bit in the ciphertext or auth tag
        ciphertext[0] ^= 0x01;

        let result = decrypt_aes_gcm(&key, &nonce, &ciphertext);
        assert!(result.is_err());
    }

    #[test]
    fn test_aes_gcm_wrong_key_fails() {
        let key1 = [1u8; 32];
        let key2 = [2u8; 32];
        let data = b"Vault content";

        let (nonce, ciphertext) = encrypt_aes_gcm(&key1, data).unwrap();
        let result = decrypt_aes_gcm(&key2, &nonce, &ciphertext);
        assert!(result.is_err());
    }
}
