import Foundation
import CryptoKit
import Security

public enum CryptoVaultError: LocalizedError {
    case vaultLocked
    case invalidPassword
    case decryptionFailed
    case fileCorrupted
    case keychainError(OSStatus)

    public var errorDescription: String? {
        switch self {
        case .vaultLocked: return "Сейф заблокирован"
        case .invalidPassword: return "Неверный мастер-пароль или PIN"
        case .decryptionFailed: return "Ошибка расшифровки данных"
        case .fileCorrupted: return "Файл хранилища поврежден"
        case .keychainError(let code): return "Ошибка Keychain: \(code)"
        }
    }
}

public final class CryptoVaultService: ObservableObject {
    public static let shared = CryptoVaultService()

    @Published public private(set) var isInitialized: Bool = false
    @Published public private(set) var isUnlocked: Bool = false
    @Published public private(set) var vaultData: VaultData = .default

    private var activeKey: SymmetricKey?
    private let fileManager = FileManager.default
    private let keychainService = "com.tsifra.seif.master"
    private let keychainAccount = "masterKey"

    private var vaultURL: URL {
        let docs = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent("vault.enc")
    }

    public init() {
        self.isInitialized = fileManager.fileExists(atPath: vaultURL.path)
    }

    /// Derives a 256-bit symmetric key using HKDF-SHA256 from user password and salt
    private func deriveKey(password: String, salt: Data) -> SymmetricKey {
        let inputKey = SymmetricKey(data: Data(password.utf8))
        return HKDF<SHA256>.deriveKey(
            inputKeyMaterial: inputKey,
            salt: salt,
            info: Data("TsifraSafe-V1-MasterKey".utf8),
            outputByteCount: 32
        )
    }

    /// Initializes a new vault container with a master password
    public func initialize(password: String) throws {
        var salt = Data(count: 16)
        _ = salt.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, 16, $0.baseAddress!) }

        let key = deriveKey(password: password, salt: salt)
        let initialData = VaultData.default

        let encoded = try JSONEncoder().encode(initialData)
        let sealed = try AES.GCM.seal(encoded, using: key)

        guard let combined = sealed.combined else {
            throw CryptoVaultError.decryptionFailed
        }

        // Header: MAGIC (4B "TSRF") + SALT (16B) + COMBINED (NONCE + CIPHERTEXT + TAG)
        var fileData = Data("TSRF".utf8)
        fileData.append(salt)
        fileData.append(combined)

        try fileData.write(to: vaultURL, options: .atomic)

        self.activeKey = key
        self.vaultData = initialData
        self.isInitialized = true
        self.isUnlocked = true

        saveMasterTokenToKeychain(password: password)
    }

    /// Unlocks the vault using password or PIN
    public func unlock(password: String) throws {
        guard fileManager.fileExists(atPath: vaultURL.path) else {
            throw CryptoVaultError.fileCorrupted
        }

        let fileData = try Data(contentsOf: vaultURL)
        guard fileData.count > 20 else { throw CryptoVaultError.fileCorrupted }

        let magic = String(data: fileData[0..<4], encoding: .utf8)
        guard magic == "TSRF" else { throw CryptoVaultError.fileCorrupted }

        let salt = fileData[4..<20]
        let sealedData = fileData[20...]

        let key = deriveKey(password: password, salt: salt)

        do {
            let sealedBox = try AES.GCM.SealedBox(combined: sealedData)
            let decryptedData = try AES.GCM.open(sealedBox, using: key)
            let loaded = try JSONDecoder().decode(VaultData.self, from: decryptedData)

            self.activeKey = key
            self.vaultData = loaded
            self.isUnlocked = true

            saveMasterTokenToKeychain(password: password)
        } catch {
            throw CryptoVaultError.invalidPassword
        }
    }

    /// Locks the vault and purges keys from memory
    public func lock() {
        self.activeKey = nil
        self.vaultData = .default
        self.isUnlocked = false
    }

    /// Saves updated vault data atomically with AES-GCM
    public func saveItem(_ item: VaultItem) throws {
        guard let key = activeKey, isUnlocked else { throw CryptoVaultError.vaultLocked }

        var current = vaultData
        if let idx = current.items.firstIndex(where: { $0.id == item.id }) {
            current.items[idx] = item
        } else {
            current.items.insert(item, at: 0)
        }
        current.updatedAt = Date()

        try persistVault(data: current, key: key)
        self.vaultData = current
    }

    public func deleteItem(id: String) throws {
        guard let key = activeKey, isUnlocked else { throw CryptoVaultError.vaultLocked }

        var current = vaultData
        current.items.removeAll { $0.id == id }
        current.updatedAt = Date()

        try persistVault(data: current, key: key)
        self.vaultData = current
    }

    public func updateSettings(_ settings: VaultSettings) throws {
        guard let key = activeKey, isUnlocked else { throw CryptoVaultError.vaultLocked }

        var current = vaultData
        current.settings = settings
        current.updatedAt = Date()

        try persistVault(data: current, key: key)
        self.vaultData = current
    }

    private func persistVault(data: VaultData, key: SymmetricKey) throws {
        var salt = Data(count: 16)
        _ = salt.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, 16, $0.baseAddress!) }

        let encoded = try JSONEncoder().encode(data)
        let sealed = try AES.GCM.seal(encoded, using: key)
        guard let combined = sealed.combined else { throw CryptoVaultError.decryptionFailed }

        var fileData = Data("TSRF".utf8)
        fileData.append(salt)
        fileData.append(combined)

        try fileData.write(to: vaultURL, options: .atomic)
    }

    // MARK: - Keychain Biometric Token
    private func saveMasterTokenToKeychain(password: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecValueData as String: Data(password.utf8),
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    public func getSavedMasterToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    public func exportEncryptedBackup() throws -> Data {
        return try Data(contentsOf: vaultURL)
    }

    public func importEncryptedBackup(data: Data, password: String) throws {
        guard data.count > 20 else { throw CryptoVaultError.fileCorrupted }
        let tempURL = vaultURL.appendingPathExtension("import")
        try data.write(to: tempURL, options: .atomic)

        // Try unlocking from imported file
        let original = vaultURL
        try fileManager.removeItem(at: original)
        try fileManager.moveItem(at: tempURL, to: original)

        try unlock(password: password)
    }
}
