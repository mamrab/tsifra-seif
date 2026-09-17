import Foundation

public enum VaultItemType: String, Codable, CaseIterable, Identifiable {
    case password = "password"
    case cryptoWallet = "cryptoWallet"
    case secureNote = "secureNote"
    case paymentCard = "paymentCard"
    case serverKey = "serverKey"

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .password: return "Пароль"
        case .cryptoWallet: return "Крипто"
        case .secureNote: return "Заметка"
        case .paymentCard: return "Карта"
        case .serverKey: return "Ключ / API"
        }
    }

    public var systemIcon: String {
        switch self {
        case .password: return "key.fill"
        case .cryptoWallet: return "bitcoinsign.circle.fill"
        case .secureNote: return "note.text"
        case .paymentCard: return "creditcard.fill"
        case .serverKey: return "server.rack"
        }
    }
}

public struct CryptoWalletData: Codable, Equatable, Hashable {
    public var network: String
    public var wordCount: Int
    public var words: [String]
    public var privateKey: String?
    public var address: String?
    public var derivationPath: String?
    public var passphrase: String?
    public var rpcUrl: String?
    public var chainId: String?
    public var walletApp: String?

    public init(
        network: String = "Ethereum / EVM",
        wordCount: Int = 12,
        words: [String] = Array(repeating: "", count: 12),
        privateKey: String? = nil,
        address: String? = nil,
        derivationPath: String? = "m/44'/60'/0'/0/0",
        passphrase: String? = nil,
        rpcUrl: String? = "https://eth.llamarpc.com",
        chainId: String? = "1",
        walletApp: String? = "MetaMask / Rabby"
    ) {
        self.network = network
        self.wordCount = wordCount
        self.words = words
        self.privateKey = privateKey
        self.address = address
        self.derivationPath = derivationPath
        self.passphrase = passphrase
        self.rpcUrl = rpcUrl
        self.chainId = chainId
        self.walletApp = walletApp
    }
}

public struct CustomField: Identifiable, Codable, Equatable, Hashable {
    public var id: String
    public var label: String
    public var value: String
    public var isSecret: Bool

    public init(id: String = UUID().uuidString, label: String, value: String, isSecret: Bool = false) {
        self.id = id
        self.label = label
        self.value = value
        self.isSecret = isSecret
    }
}

public struct VaultItem: Identifiable, Codable, Equatable, Hashable {
    public var id: String
    public var title: String
    public var itemType: VaultItemType
    public var username: String?
    public var password: String?
    public var url: String?
    public var notes: String?
    public var category: String
    public var tags: [String]
    public var favorite: Bool
    public var customFields: [CustomField]
    public var cryptoData: CryptoWalletData?
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: String = UUID().uuidString,
        title: String,
        itemType: VaultItemType = .password,
        username: String? = nil,
        password: String? = nil,
        url: String? = nil,
        notes: String? = nil,
        category: String = "Общие",
        tags: [String] = [],
        favorite: Bool = false,
        customFields: [CustomField] = [],
        cryptoData: CryptoWalletData? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.itemType = itemType
        self.username = username
        self.password = password
        self.url = url
        self.notes = notes
        self.category = category
        self.tags = tags
        self.favorite = favorite
        self.customFields = customFields
        self.cryptoData = cryptoData
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

public struct VaultSettings: Codable, Equatable {
    public var autoLockMinutes: Int
    public var lockOnBackground: Bool
    public var biometricsEnabled: Bool
    public var clipboardClearSeconds: Int

    public static let `default` = VaultSettings(
        autoLockMinutes: 5,
        lockOnBackground: true,
        biometricsEnabled: true,
        clipboardClearSeconds: 30
    )
}

public struct VaultData: Codable {
    public var version: Int
    public var items: [VaultItem]
    public var categories: [String]
    public var settings: VaultSettings
    public var updatedAt: Date

    public static let `default` = VaultData(
        version: 2,
        items: [],
        categories: ["Общие", "Крипта", "Финансы", "Работа", "Личное"],
        settings: .default,
        updatedAt: Date()
    )
}
