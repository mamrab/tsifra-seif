import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct ItemDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var vaultService: CryptoVaultService

    private let originalItem: VaultItem?

    @State private var title: String
    @State private var itemType: VaultItemType
    @State private var username: String
    @State private var password: String
    @State private var url: String
    @State private var notes: String
    @State private var category: String
    @State private var favorite: Bool

    // Crypto state
    @State private var cryptoNetwork: String
    @State private var cryptoWordCount: Int
    @State private var cryptoWords: [String]
    @State private var cryptoPrivateKey: String
    @State private var cryptoAddress: String
    @State private var cryptoDerivationPath: String
    @State private var cryptoPassphrase: String
    @State private var cryptoRpcUrl: String
    @State private var cryptoChainId: String
    @State private var cryptoWalletApp: String

    @State private var isPasswordVisible: Bool = false
    @State private var isPrivateKeyVisible: Bool = false
    @State private var isGeneratorPresented: Bool = false
    @State private var showDeleteConfirmation: Bool = false
    @State private var cryptoSubtab: Int = 0 // 0: Seed, 1: PK, 2: Settings

    public init(vaultService: CryptoVaultService, item: VaultItem?) {
        self.vaultService = vaultService
        self.originalItem = item

        _title = State(initialValue: item?.title ?? "")
        _itemType = State(initialValue: item?.itemType ?? .password)
        _username = State(initialValue: item?.username ?? "")
        _password = State(initialValue: item?.password ?? "")
        _url = State(initialValue: item?.url ?? "")
        _notes = State(initialValue: item?.notes ?? "")
        _category = State(initialValue: item?.category ?? "Общие")
        _favorite = State(initialValue: item?.favorite ?? false)

        let cd = item?.cryptoData ?? CryptoWalletData()
        _cryptoNetwork = State(initialValue: cd.network)
        _cryptoWordCount = State(initialValue: cd.wordCount)
        _cryptoWords = State(initialValue: cd.words)
        _cryptoPrivateKey = State(initialValue: cd.privateKey ?? "")
        _cryptoAddress = State(initialValue: cd.address ?? "")
        _cryptoDerivationPath = State(initialValue: cd.derivationPath ?? "m/44'/60'/0'/0/0")
        _cryptoPassphrase = State(initialValue: cd.passphrase ?? "")
        _cryptoRpcUrl = State(initialValue: cd.rpcUrl ?? "")
        _cryptoChainId = State(initialValue: cd.chainId ?? "")
        _cryptoWalletApp = State(initialValue: cd.walletApp ?? "")
    }

    private var iconColors: [Color] {
        switch itemType {
        case .cryptoWallet:
            return [Color.appleGreen, Color.emeraldAccent]
        case .password:
            return [Color.appleBlue, Color.cyanAccent]
        case .creditCard:
            return [Color.appleIndigo, Color.purpleAccent]
        case .secureNote:
            return [Color.appleOrange, Color.appleYellow]
        case .apiKey:
            return [Color.applePink, Color.applePurple]
        }
    }

    private var smartHints: [String] {
        var hints: [String] = []
        if title.trimmingCharacters(in: .whitespaces).isEmpty {
            hints.append("Не указано название записи")
        }
        if itemType == .cryptoWallet {
            let filledCount = cryptoWords.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }.count
            let hasPk = !cryptoPrivateKey.trimmingCharacters(in: .whitespaces).isEmpty
            if filledCount == 0 && !hasPk {
                hints.append("Забыли добавить Seed-фразу или Private Key")
            } else if filledCount > 0 && filledCount < cryptoWordCount {
                hints.append("Заполнено только \(filledCount) из \(cryptoWordCount) слов")
            }
            if cryptoAddress.trimmingCharacters(in: .whitespaces).isEmpty {
                hints.append("Рекомендуется добавить публичный адрес кошелька для сверки")
            }
        } else if itemType != .secureNote {
            if password.trimmingCharacters(in: .whitespaces).isEmpty {
                hints.append("Поле пароля не заполнено")
            } else if password.count < 10 {
                hints.append("Пароль короче 10 символов — используйте «Сгенерировать»")
            }
            if username.trimmingCharacters(in: .whitespaces).isEmpty {
                hints.append("Не указан логин или почта")
            }
        }
        return hints
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackground()

                ScrollView {
                    VStack(spacing: 20) {
                        // 1. Classic Apple Header (Icon Squircle + Title Field)
                        VStack(spacing: 12) {
                            AppleSquircleIcon(icon: itemType.systemIcon, gradientColors: iconColors, size: 64)
                                .shadow(color: iconColors.first?.opacity(0.4) ?? Color.clear, radius: 12, x: 0, y: 6)

                            TextField(itemType == .cryptoWallet ? "Название кошелька" : "Название учетной записи", text: $title)
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 20)

                            // Type Picker (Segmented)
                            Picker("Тип записи", selection: $itemType) {
                                ForEach(VaultItemType.allCases) { t in
                                    Text(t.title).tag(t)
                                }
                            }
                            .pickerStyle(.segmented)
                            .padding(.horizontal, 16)
                        }
                        .padding(.top, 10)

                        // 2. Smart Security Hints (if any)
                        if !smartHints.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(spacing: 8) {
                                    Image(systemName: "lightbulb.fill")
                                        .foregroundColor(Color.appleYellow)
                                        .font(.system(size: 13))
                                    Text("Рекомендации ассистента")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.white)
                                }

                                ForEach(smartHints, id: \.self) { hint in
                                    HStack(alignment: .top, spacing: 6) {
                                        Image(systemName: "exclamationmark.triangle.fill")
                                            .font(.system(size: 10))
                                            .foregroundColor(Color.appleOrange)
                                            .padding(.top, 2)
                                        Text(hint)
                                            .font(.system(size: 12))
                                            .foregroundColor(.white.opacity(0.85))
                                    }
                                }
                            }
                            .padding(14)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                ZStack {
                                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                                        .fill(.ultraThinMaterial)
                                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                                        .stroke(Color.appleOrange.opacity(0.35), lineWidth: 1.0)
                                }
                            )
                            .padding(.horizontal, 16)
                        }

                        // 3. CRYPTO WALLET SECTION
                        if itemType == .cryptoWallet {
                            VStack(alignment: .leading, spacing: 14) {
                                Text("ПАРАМЕТРЫ КОШЕЛЬКА")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.55))
                                    .padding(.horizontal, 4)

                                VStack(spacing: 14) {
                                    // Subtab: Seed / Private Key / Network
                                    Picker("Раздел", selection: $cryptoSubtab) {
                                        Text("Seed-фраза").tag(0)
                                        Text("Private Key").tag(1)
                                        Text("Сеть и RPC").tag(2)
                                    }
                                    .pickerStyle(.segmented)

                                    if cryptoSubtab == 0 {
                                        // Words length picker
                                        HStack {
                                            Text("Длина фразы:")
                                                .font(.system(size: 13, weight: .medium))
                                                .foregroundColor(.white.opacity(0.7))
                                            Spacer()
                                            Picker("Слов", selection: $cryptoWordCount) {
                                                Text("12").tag(12)
                                                Text("18").tag(18)
                                                Text("24").tag(24)
                                            }
                                            .pickerStyle(.segmented)
                                            .frame(width: 150)
                                            .onChange(of: cryptoWordCount) { _, newCount in
                                                adjustWordCount(to: newCount)
                                            }
                                        }

                                        // Seed Words Grid
                                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                                            ForEach(0..<cryptoWordCount, id: \.self) { idx in
                                                HStack(spacing: 6) {
                                                    Text(String(format: "%02d", idx + 1))
                                                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                                                        .foregroundColor(.white.opacity(0.4))
                                                        .frame(width: 20)

                                                    TextField("слово", text: Binding(
                                                        get: { idx < cryptoWords.count ? cryptoWords[idx] : "" },
                                                        set: { val in
                                                            if idx < cryptoWords.count {
                                                                cryptoWords[idx] = val.lowercased().trimmingCharacters(in: .whitespaces)
                                                            }
                                                        }
                                                    ))
                                                    .font(.system(size: 13, design: .monospaced))
                                                    .foregroundColor(.white)
                                                    .autocapitalization(.none)
                                                    .disableAutocorrection(true)
                                                }
                                                .padding(.horizontal, 10)
                                                .padding(.vertical, 8)
                                                .liquidGlassInput(cornerRadius: 10)
                                            }
                                        }

                                        // Paste full string button
                                        Button(action: pasteEntireSeedString) {
                                            HStack(spacing: 6) {
                                                Image(systemName: "doc.on.clipboard")
                                                Text("Вставить сид-фразу из буфера")
                                            }
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundColor(.white)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 10)
                                            .background(Color.white.opacity(0.12))
                                            .clipShape(RoundedRectangle(cornerRadius: 12))
                                        }

                                        appleInputField(title: "Passphrase (25-е слово)", value: $cryptoPassphrase, icon: "lock.shield", isSecure: true)
                                    } else if cryptoSubtab == 1 {
                                        // Private key subtab
                                        VStack(alignment: .leading, spacing: 10) {
                                            Text("Приватный ключ кошелька")
                                                .font(.system(size: 12, weight: .medium))
                                                .foregroundColor(.white.opacity(0.6))

                                            HStack {
                                                Image(systemName: "key.fill")
                                                    .foregroundColor(.white.opacity(0.4))
                                                    .frame(width: 20)

                                                if isPrivateKeyVisible {
                                                    TextField("0x... или Base58", text: $cryptoPrivateKey)
                                                        .font(.system(size: 13, design: .monospaced))
                                                        .foregroundColor(.white)
                                                        .autocapitalization(.none)
                                                        .disableAutocorrection(true)
                                                } else {
                                                    SecureField("0x... или Base58", text: $cryptoPrivateKey)
                                                        .font(.system(size: 13, design: .monospaced))
                                                        .foregroundColor(.white)
                                                }

                                                Button(action: { isPrivateKeyVisible.toggle() }) {
                                                    Image(systemName: isPrivateKeyVisible ? "eye.slash.fill" : "eye.fill")
                                                        .foregroundColor(.white.opacity(0.6))
                                                }
                                            }
                                            .padding(12)
                                            .liquidGlassInput(cornerRadius: 12)

                                            Button(action: pastePrivateKey) {
                                                HStack(spacing: 6) {
                                                    Image(systemName: "doc.on.clipboard.fill")
                                                    Text("Вставить Private Key из буфера")
                                                }
                                                .font(.system(size: 13, weight: .semibold))
                                                .foregroundColor(.white)
                                                .frame(maxWidth: .infinity)
                                                .padding(.vertical, 10)
                                                .background(Color.white.opacity(0.12))
                                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                            }
                                        }
                                    } else {
                                        // Network subtab
                                        VStack(spacing: 10) {
                                            appleInputField(title: "Блокчейн / Сеть", value: $cryptoNetwork, icon: "globe")
                                            appleInputField(title: "Публичный адрес", value: $cryptoAddress, icon: "number")
                                            appleInputField(title: "Путь деривации", value: $cryptoDerivationPath, icon: "arrow.triangle.branch")
                                            appleInputField(title: "RPC URL", value: $cryptoRpcUrl, icon: "link")
                                            appleInputField(title: "Chain ID", value: $cryptoChainId, icon: "tag")
                                            appleInputField(title: "Приложение кошелька", value: $cryptoWalletApp, icon: "apps.iphone")
                                        }
                                    }
                                }
                                .padding(16)
                                .liquidGlassCard(cornerRadius: 20)
                            }
                            .padding(.horizontal, 16)
                        }

                        // 4. ACCOUNT CREDENTIALS (For Passwords / Cards / API Keys)
                        if itemType != .secureNote && itemType != .cryptoWallet {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("УЧЕТНЫЕ ДАННЫЕ")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.55))
                                    .padding(.horizontal, 4)

                                VStack(spacing: 12) {
                                    appleInputField(title: "Логин / Email / Телефон", value: $username, icon: "person.fill")

                                    // Password field with Reveal and Generator
                                    VStack(alignment: .leading, spacing: 6) {
                                        HStack {
                                            Text("Пароль")
                                                .font(.system(size: 12, weight: .medium))
                                                .foregroundColor(.white.opacity(0.6))
                                            Spacer()
                                            Button(action: { isGeneratorPresented = true }) {
                                                HStack(spacing: 4) {
                                                    Image(systemName: "sparkles")
                                                    Text("Сгенерировать")
                                                }
                                                .font(.system(size: 12, weight: .semibold))
                                                .foregroundColor(Color.cyanAccent)
                                            }
                                        }

                                        HStack {
                                            Image(systemName: "lock.fill")
                                                .foregroundColor(.white.opacity(0.4))
                                                .frame(width: 20)

                                            if isPasswordVisible {
                                                TextField("Пароль", text: $password)
                                                    .font(.system(size: 14, design: .monospaced))
                                                    .foregroundColor(.white)
                                            } else {
                                                SecureField("Пароль", text: $password)
                                                    .font(.system(size: 14, design: .monospaced))
                                                    .foregroundColor(.white)
                                            }

                                            Button(action: { isPasswordVisible.toggle() }) {
                                                Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                                    .foregroundColor(.white.opacity(0.6))
                                            }

                                            if !password.isEmpty {
                                                Button(action: {
                                                    #if canImport(UIKit)
                                                    UIPasteboard.general.string = password
                                                    let impact = UINotificationFeedbackGenerator()
                                                    impact.notificationOccurred(.success)
                                                    #endif
                                                }) {
                                                    Image(systemName: "doc.on.doc.fill")
                                                        .foregroundColor(.white.opacity(0.8))
                                                }
                                            }
                                        }
                                        .padding(12)
                                        .liquidGlassInput(cornerRadius: 14)
                                    }

                                    appleInputField(title: "Веб-сайт", value: $url, icon: "link")
                                }
                                .padding(16)
                                .liquidGlassCard(cornerRadius: 20)
                            }
                            .padding(.horizontal, 16)
                        }

                        // 5. ADDITIONAL SETTINGS (Category, Favorite, Note)
                        VStack(alignment: .leading, spacing: 10) {
                            Text("ДОПОЛНИТЕЛЬНО")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.white.opacity(0.55))
                                .padding(.horizontal, 4)

                            VStack(spacing: 14) {
                                // Favorite toggle row
                                HStack {
                                    AppleSquircleIcon(icon: "star.fill", gradientColors: [Color.appleYellow, Color.appleOrange], size: 30)
                                    Text("Избранная запись")
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(.white)
                                    Spacer()
                                    Toggle("", isOn: $favorite)
                                        .tint(Color.appleBlue)
                                }

                                Divider().background(Color.white.opacity(0.08))

                                appleInputField(title: "Категория", value: $category, icon: "folder.fill")

                                Divider().background(Color.white.opacity(0.08))

                                // Secure Notes Editor
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Защищенная заметка")
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundColor(.white.opacity(0.6))

                                    TextEditor(text: $notes)
                                        .frame(minHeight: 90)
                                        .font(.system(size: 14, design: .monospaced))
                                        .foregroundColor(.white)
                                        .scrollContentBackground(.hidden)
                                        .padding(8)
                                        .liquidGlassInput(cornerRadius: 12)
                                }
                            }
                            .padding(16)
                            .liquidGlassCard(cornerRadius: 20)
                        }
                        .padding(.horizontal, 16)

                        // 6. Delete Button (if editing existing item)
                        if originalItem != nil {
                            Button(role: .destructive, action: { showDeleteConfirmation = true }) {
                                HStack(spacing: 8) {
                                    Image(systemName: "trash.fill")
                                    Text("Удалить запись")
                                }
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(Color(red: 1.0, green: 0.35, blue: 0.35))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                                            .fill(.ultraThinMaterial)
                                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                                            .stroke(Color.red.opacity(0.25), lineWidth: 1.0)
                                    }
                                )
                            }
                            .padding(.horizontal, 16)
                            .padding(.top, 4)
                        }
                    }
                    .padding(.bottom, 36)
                }
            }
            .navigationTitle(originalItem == nil ? "Новая запись" : "Редактирование")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }
                        .foregroundColor(.white.opacity(0.8))
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Сохранить") { saveRecord() }
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .sheet(isPresented: $isGeneratorPresented) {
                GeneratorSheet { generated in
                    self.password = generated
                }
            }
            .alert("Удалить запись?", isPresented: $showDeleteConfirmation) {
                Button("Удалить", role: .destructive) {
                    if let id = originalItem?.id {
                        try? vaultService.deleteItem(id: id)
                        dismiss()
                    }
                }
                Button("Отмена", role: .cancel) {}
            } message: {
                Text("Эта запись будет навсегда стерта из локального зашифрованного хранилища.")
            }
        }
    }

    private func adjustWordCount(to newCount: Int) {
        if newCount > cryptoWords.count {
            cryptoWords.append(contentsOf: Array(repeating: "", count: newCount - cryptoWords.count))
        } else if newCount < cryptoWords.count {
            cryptoWords = Array(cryptoWords.prefix(newCount))
        }
    }

    private func pasteEntireSeedString() {
        #if canImport(UIKit)
        if let str = UIPasteboard.general.string {
            let split = str.components(separatedBy: CharacterSet.whitespacesAndNewlines).filter { !$0.isEmpty }
            if !split.isEmpty {
                let target = split.count >= 24 ? 24 : (split.count >= 18 ? 18 : 12)
                cryptoWordCount = target
                var newWords = split.map { $0.lowercased() }
                while newWords.count < target {
                    newWords.append("")
                }
                cryptoWords = Array(newWords.prefix(target))
            }
        }
        #endif
    }

    private func pastePrivateKey() {
        #if canImport(UIKit)
        if let str = UIPasteboard.general.string {
            cryptoPrivateKey = str.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        #endif
    }

    private func appleInputField(title: String, value: Binding<String>, icon: String, isSecure: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.white.opacity(0.6))
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.white.opacity(0.4))
                    .frame(width: 20)
                if isSecure {
                    SecureField(title, text: value)
                        .font(.system(size: 14, design: .monospaced))
                        .foregroundColor(.white)
                } else {
                    TextField(title, text: value)
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                        .autocapitalization(.none)
                }
            }
        }
        .padding(12)
        .liquidGlassInput(cornerRadius: 14)
    }

    private func saveRecord() {
        let cryptoData: CryptoWalletData? = itemType == .cryptoWallet ? CryptoWalletData(
            network: cryptoNetwork,
            wordCount: cryptoWordCount,
            words: cryptoWords,
            privateKey: cryptoPrivateKey.isEmpty ? nil : cryptoPrivateKey,
            address: cryptoAddress.isEmpty ? nil : cryptoAddress,
            derivationPath: cryptoDerivationPath.isEmpty ? nil : cryptoDerivationPath,
            passphrase: cryptoPassphrase.isEmpty ? nil : cryptoPassphrase,
            rpcUrl: cryptoRpcUrl.isEmpty ? nil : cryptoRpcUrl,
            chainId: cryptoChainId.isEmpty ? nil : cryptoChainId,
            walletApp: cryptoWalletApp.isEmpty ? nil : cryptoWalletApp
        ) : nil

        let updated = VaultItem(
            id: originalItem?.id ?? UUID().uuidString,
            title: title.trimmingCharacters(in: .whitespaces),
            itemType: itemType,
            username: itemType != .secureNote && itemType != .cryptoWallet ? username : nil,
            password: itemType != .secureNote && itemType != .cryptoWallet ? password : nil,
            url: itemType == .password ? url : nil,
            notes: notes,
            category: category,
            tags: originalItem?.tags ?? [],
            favorite: favorite,
            customFields: originalItem?.customFields ?? [],
            cryptoData: cryptoData,
            createdAt: originalItem?.createdAt ?? Date(),
            updatedAt: Date()
        )

        try? vaultService.saveItem(updated)
        dismiss()
    }
}
