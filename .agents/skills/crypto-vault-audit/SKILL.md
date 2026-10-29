---
name: crypto-vault-audit
description: Проведение специализированного аудита безопасности для криптографического сейфа (Tsifra Safe), включая хранение мнемоник, семян (seed), шифрование SQLite/SQLCipher, проверку Swift Native модулей и защиту буферов в памяти.
---

# Tsifra Safe Crypto Vault Audit

Специализированный регламент аудита криптографического сейфа и хранилища семян (Seed Phrase).

## 1. Аудит генерации и хранения Seed-фразы
- **Энтропия**: Убедитесь, что энтропия генерируется исключительно через криптографически стойкие генераторы (`SecRandomCopyBytes` в Swift / iOS, `SecureRandom` в Android/Java).
- **Очистка памяти**: Любые строковые или байтовые представления мнемоники в оперативной памяти должны очищаться после использования (zeroization / memset_s).
- **Защита в UI**: В компонентах отображения сетки мнемоники (`CryptoSeedGrid.tsx`):
  - Предотвращать скриншоты и захват экрана (FLAG_SECURE на Android, `isSecureTextEntry` / secure container на iOS).
  - Отключать буфер обмена или очищать его по таймеру (30-60 секунд).

## 2. Аудит Swift Native Module (`CryptoVaultService.swift`)
- **Keychain Access**: Проверять флаги доступности ключей:
  `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` или `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`.
- **Biometrics**: Требовать аутентификацию биометрии (`LocalAuthentication`) перед отдачей расшифрованного ключа мастер-базы.
- **Шифрование**: Проверять использование AES-256-GCM или ChaCha20-Poly1305. Убедиться, что Initialization Vector (IV / Nonce) никогда не используется повторно (генерируется случайно 12 байт для каждой операции).

## 3. Аудит базы данных (`DatabaseSwitcherModal.tsx`)
- Проверять, что переключение баз данных не оставляет расшифрованные дескрипторы открытыми в памяти.
- Проверять валидацию пароля мастер-ключа через Key Derivation Function (Argon2id или PBKDF2 с HMAC-SHA512).
