import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct DashboardView: View {
    @ObservedObject var vaultService: CryptoVaultService

    @State private var searchText: String = ""
    @State private var selectedFilter: VaultFilter = .all
    @State private var selectedItem: VaultItem?
    @State private var isCreatingItem: Bool = false
    @State private var isGeneratorPresented: Bool = false
    @State private var isSettingsPresented: Bool = false
    @State private var copiedItemId: String?
    @State private var showForgottenHintsSheet: Bool = false

    public enum VaultFilter: String, CaseIterable, Identifiable {
        case all = "Все"
        case crypto = "Крипто"
        case passwords = "Пароли"
        case notes = "Заметки"
        case favorites = "Избранное"

        public var id: String { rawValue }

        public var icon: String {
            switch self {
            case .all: return "tray.full.fill"
            case .crypto: return "bitcoinsign.circle.fill"
            case .passwords: return "key.fill"
            case .notes: return "note.text"
            case .favorites: return "star.fill"
            }
        }

        public var colors: [Color] {
            switch self {
            case .all: return [Color.appleBlue, Color.cyanAccent]
            case .crypto: return [Color.appleGreen, Color.emeraldAccent]
            case .passwords: return [Color.cyanAccent, Color.appleIndigo]
            case .notes: return [Color.appleOrange, Color.appleYellow]
            case .favorites: return [Color.appleYellow, Color.appleOrange]
            }
        }
    }

    public init(vaultService: CryptoVaultService) {
        self.vaultService = vaultService
    }

    private var allItems: [VaultItem] {
        vaultService.vaultData.items
    }

    private var filteredItems: [VaultItem] {
        allItems.filter { item in
            let matchesFilter: Bool
            switch selectedFilter {
            case .all:
                matchesFilter = true
            case .crypto:
                matchesFilter = item.itemType == .cryptoWallet
            case .passwords:
                matchesFilter = item.itemType == .password || item.itemType == .creditCard || item.itemType == .apiKey
            case .notes:
                matchesFilter = item.itemType == .secureNote
            case .favorites:
                matchesFilter = item.favorite
            }

            if !searchText.isEmpty {
                let q = searchText.lowercased()
                let titleMatch = item.title.lowercased().contains(q)
                let userMatch = item.username?.lowercased().contains(q) ?? false
                let notesMatch = item.notes?.lowercased().contains(q) ?? false
                let cryptoMatch = item.cryptoData?.words.contains(where: { $0.lowercased().contains(q) }) ?? false
                let addrMatch = item.cryptoData?.address?.lowercased().contains(q) ?? false
                return matchesFilter && (titleMatch || userMatch || notesMatch || cryptoMatch || addrMatch)
            }
            return matchesFilter
        }
    }

    private func countFor(filter: VaultFilter) -> Int {
        switch filter {
        case .all: return allItems.count
        case .crypto: return allItems.filter { $0.itemType == .cryptoWallet }.count
        case .passwords: return allItems.filter { $0.itemType == .password || $0.itemType == .creditCard || $0.itemType == .apiKey }.count
        case .notes: return allItems.filter { $0.itemType == .secureNote }.count
        case .favorites: return allItems.filter { $0.favorite }.count
        }
    }

    // Identify what user forgot
    private var forgottenCount: Int {
        var count = 0
        for item in allItems {
            if item.itemType == .cryptoWallet {
                let wordsFilled = item.cryptoData?.words.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }.count ?? 0
                let hasPk = !(item.cryptoData?.privateKey?.trimmingCharacters(in: .whitespaces).isEmpty ?? true)
                if wordsFilled == 0 && !hasPk { count += 1 }
                if (item.cryptoData?.address?.trimmingCharacters(in: .whitespaces).isEmpty ?? true) { count += 1 }
            } else if item.itemType != .secureNote {
                if item.password?.isEmpty ?? true { count += 1 }
                if item.username?.isEmpty ?? true { count += 1 }
            }
        }
        return count
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackground()

                ScrollView {
                    VStack(spacing: 20) {
                        // 1. Classic Apple Passwords Summary Grid (iOS 18/27 Style)
                        if searchText.isEmpty {
                            VStack(spacing: 12) {
                                LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                                    ForEach([VaultFilter.all, VaultFilter.crypto, VaultFilter.passwords, VaultFilter.favorites]) { f in
                                        AppleCategoryTile(
                                            title: f.rawValue,
                                            count: countFor(filter: f),
                                            icon: f.icon,
                                            colors: f.colors,
                                            isSelected: selectedFilter == f
                                        ) {
                                            selectedFilter = f
                                        }
                                    }
                                }

                                // Security Recommendation Banner (Apple Passwords Audit)
                                if forgottenCount > 0 {
                                    Button(action: { showForgottenHintsSheet = true }) {
                                        HStack(spacing: 12) {
                                            AppleSquircleIcon(
                                                icon: "exclamationmark.shield.fill",
                                                gradientColors: [Color.appleOrange, Color.appleYellow],
                                                size: 34
                                            )

                                            VStack(alignment: .leading, spacing: 2) {
                                                Text("Рекомендации безопасности")
                                                    .font(.system(size: 14, weight: .semibold))
                                                    .foregroundColor(.white)
                                                Text("\(forgottenCount) записей с пустыми паролями или seed")
                                                    .font(.system(size: 11))
                                                    .foregroundColor(.white.opacity(0.65))
                                            }

                                            Spacer()

                                            ZStack {
                                                Capsule()
                                                    .fill(Color.appleOrange.opacity(0.2))
                                                    .frame(width: 28, height: 20)
                                                Text("\(forgottenCount)")
                                                    .font(.system(size: 11, weight: .bold))
                                                    .foregroundColor(Color.appleOrange)
                                            }

                                            Image(systemName: "chevron.right")
                                                .font(.system(size: 12, weight: .semibold))
                                                .foregroundColor(.white.opacity(0.4))
                                        }
                                        .padding(14)
                                        .background(
                                            ZStack {
                                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                                    .fill(.ultraThinMaterial)
                                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                                    .stroke(Color.appleOrange.opacity(0.35), lineWidth: 1.0)
                                            }
                                        )
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.top, 4)
                        }

                        // 2. Grouped Inset Items Section (Classic Apple List Pattern)
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(selectedFilter == .all ? "ВСЕ ЗАПИСИ" : selectedFilter.rawValue.uppercased())
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.55))
                                    .tracking(0.5)

                                Spacer()

                                Text("\(filteredItems.count)")
                                    .font(.system(size: 12, weight: .medium, design: .rounded))
                                    .foregroundColor(.white.opacity(0.4))
                            }
                            .padding(.horizontal, 20)

                            if filteredItems.isEmpty {
                                VStack(spacing: 12) {
                                    AppleSquircleIcon(icon: "lock.slash.fill", gradientColors: [Color.white.opacity(0.2), Color.white.opacity(0.05)], size: 48)
                                    Text("Нет записей в этой категории")
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundColor(.white.opacity(0.8))
                                    Text("Нажмите «+» вверху, чтобы добавить пароль или кошелек")
                                        .font(.system(size: 12))
                                        .foregroundColor(.white.opacity(0.5))
                                        .multilineTextAlignment(.center)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(36)
                                .liquidGlassCard(cornerRadius: 20)
                                .padding(.horizontal, 16)
                            } else {
                                // Grouped Card Container
                                VStack(spacing: 0) {
                                    ForEach(Array(filteredItems.enumerated()), id: \.element.id) { index, item in
                                        appleItemRow(item: item)
                                            .contentShape(Rectangle())
                                            .onTapGesture {
                                                selectedItem = item
                                            }

                                        if index < filteredItems.count - 1 {
                                            Divider()
                                                .background(Color.white.opacity(0.08))
                                                .padding(.leading, 64)
                                        }
                                    }
                                }
                                .background(
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                                            .fill(.ultraThinMaterial)
                                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                                            .stroke(Color.white.opacity(0.18), lineWidth: 1.0)
                                    }
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                                .shadow(color: Color.black.opacity(0.35), radius: 14, x: 0, y: 6)
                                .padding(.horizontal, 16)
                            }
                        }
                    }
                    .padding(.bottom, 32)
                }
            }
            .navigationTitle("Сейф")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Поиск записей и seed...")
            .toolbar {
                // Leading Tools: Settings & Quick Lock
                ToolbarItemGroup(placement: .navigationBarLeading) {
                    HStack(spacing: 8) {
                        LiquidGlassIconButton(icon: "gearshape.fill", color: .white.opacity(0.9), size: 34) {
                            isSettingsPresented = true
                        }

                        LiquidGlassIconButton(icon: "lock.fill", color: Color(red: 0.98, green: 0.36, blue: 0.36), size: 34) {
                            vaultService.lock()
                        }
                    }
                }

                // Trailing Tools: Generator & Add (+)
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    HStack(spacing: 8) {
                        LiquidGlassIconButton(icon: "sparkles", color: .cyanAccent, size: 34) {
                            isGeneratorPresented = true
                        }

                        Button(action: {
                            isCreatingItem = true
                        }) {
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.white, Color(red: 0.92, green: 0.94, blue: 0.98)],
                                            startPoint: .top,
                                            endPoint: .bottom
                                        )
                                    )
                                    .frame(width: 34, height: 34)
                                    .shadow(color: Color.white.opacity(0.2), radius: 6, x: 0, y: 2)
                                Image(systemName: "plus")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(.black)
                            }
                        }
                    }
                }
            }
            .sheet(item: $selectedItem) { item in
                ItemDetailView(vaultService: vaultService, item: item)
            }
            .sheet(isPresented: $isCreatingItem) {
                ItemDetailView(vaultService: vaultService, item: nil)
            }
            .sheet(isPresented: $isGeneratorPresented) {
                GeneratorSheet()
            }
            .sheet(isPresented: $isSettingsPresented) {
                SettingsView(vaultService: vaultService)
            }
            .sheet(isPresented: $showForgottenHintsSheet) {
                forgottenHintsView
            }
        }
    }

    // =========================================================================
    // Classic Apple Item Row (Native Passwords / Inset Grouped Cell)
    // =========================================================================

    private func appleItemRow(item: VaultItem) -> some View {
        HStack(spacing: 14) {
            // Apple Squircle Icon with Color Coding
            AppleSquircleIcon(
                icon: item.itemType.systemIcon,
                gradientColors: iconColors(for: item.itemType),
                size: 38
            )

            // Titles
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(item.title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)

                    if item.favorite {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color.appleYellow)
                    }

                    if item.itemType == .cryptoWallet && item.cryptoData?.privateKey != nil {
                        Text("PK")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .padding(.horizontal, 5)
                            .padding(.vertical, 1)
                            .background(Color.white)
                            .foregroundColor(.black)
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                    }
                }

                if item.itemType == .cryptoWallet {
                    Text(item.cryptoData?.network ?? "Криптокошелек")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.55))
                        .lineLimit(1)
                } else {
                    Text(item.username ?? (item.notes?.components(separatedBy: "\n").first ?? item.category))
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.55))
                        .lineLimit(1)
                }
            }

            Spacer()

            // Quick Copy Pill Button (Seed or Password)
            if item.itemType == .cryptoWallet, let words = item.cryptoData?.words, !words.isEmpty {
                Button(action: {
                    #if canImport(UIKit)
                    UIPasteboard.general.string = words.joined(separator: " ")
                    let impact = UINotificationFeedbackGenerator()
                    impact.notificationOccurred(.success)
                    #endif
                    copiedItemId = item.id
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                        if copiedItemId == item.id { copiedItemId = nil }
                    }
                }) {
                    ZStack {
                        Capsule()
                            .fill(copiedItemId == item.id ? AnyShapeStyle(Color.white) : AnyShapeStyle(Color.white.opacity(0.10)))
                            .frame(width: 50, height: 26)
                        Text(copiedItemId == item.id ? "✓" : "Seed")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(copiedItemId == item.id ? .black : .white.opacity(0.85))
                    }
                }
            } else if let pass = item.password, !pass.isEmpty {
                Button(action: {
                    #if canImport(UIKit)
                    UIPasteboard.general.string = pass
                    let impact = UINotificationFeedbackGenerator()
                    impact.notificationOccurred(.success)
                    #endif
                    copiedItemId = item.id
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                        if copiedItemId == item.id { copiedItemId = nil }
                    }
                }) {
                    ZStack {
                        Circle()
                            .fill(copiedItemId == item.id ? AnyShapeStyle(Color.white) : AnyShapeStyle(Color.white.opacity(0.10)))
                            .frame(width: 28, height: 28)
                        Image(systemName: copiedItemId == item.id ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(copiedItemId == item.id ? .black : .white.opacity(0.85))
                    }
                }
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.white.opacity(0.25))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private func iconColors(for type: VaultItemType) -> [Color] {
        switch type {
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

    // =========================================================================
    // Forgotten Hints Modal (Apple Security Recommendations)
    // =========================================================================

    private var forgottenHintsView: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackground()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Анализ хранилища выявил поля, которые могут быть не заполнены. Проверьте записи для максимальной безопасности:")
                            .font(.system(size: 13))
                            .foregroundColor(.white.opacity(0.7))
                            .padding(.top, 4)

                        ForEach(allItems) { item in
                            let missing = missingFields(for: item)
                            if !missing.isEmpty {
                                VStack(alignment: .leading, spacing: 10) {
                                    HStack {
                                        AppleSquircleIcon(
                                            icon: item.itemType.systemIcon,
                                            gradientColors: iconColors(for: item.itemType),
                                            size: 28
                                        )

                                        Text(item.title)
                                            .font(.system(size: 15, weight: .bold))
                                            .foregroundColor(.white)

                                        Spacer()

                                        Text(item.category)
                                            .font(.system(size: 11, weight: .medium))
                                            .foregroundColor(.white.opacity(0.6))
                                    }

                                    ForEach(missing, id: \.self) { m in
                                        HStack(alignment: .top, spacing: 6) {
                                            Image(systemName: "exclamationmark.triangle.fill")
                                                .font(.system(size: 11))
                                                .foregroundColor(Color.appleOrange)
                                                .padding(.top, 2)
                                            Text(m)
                                                .font(.system(size: 12))
                                                .foregroundColor(.white.opacity(0.85))
                                        }
                                    }
                                }
                                .padding(16)
                                .liquidGlassCard(cornerRadius: 18)
                                .onTapGesture {
                                    showForgottenHintsSheet = false
                                    selectedItem = item
                                }
                            }
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Рекомендации")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Готово") {
                        showForgottenHintsSheet = false
                    }
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white)
                }
            }
        }
    }

    private func missingFields(for item: VaultItem) -> [String] {
        var m: [String] = []
        if item.itemType == .cryptoWallet {
            let filledCount = item.cryptoData?.words.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }.count ?? 0
            let hasPk = !(item.cryptoData?.privateKey?.trimmingCharacters(in: .whitespaces).isEmpty ?? true)
            if filledCount == 0 && !hasPk {
                m.append("Отсутствует и Seed-фраза, и Private Key")
            } else if filledCount > 0 && filledCount < (item.cryptoData?.wordCount ?? 12) {
                m.append("Seed-фраза заполнена не полностью (\(filledCount) из \(item.cryptoData?.wordCount ?? 12) слов)")
            }
            if (item.cryptoData?.address?.trimmingCharacters(in: .whitespaces).isEmpty ?? true) {
                m.append("Не указан публичный адрес кошелька для сверки баланса")
            }
        } else if item.itemType != .secureNote {
            if item.password?.isEmpty ?? true {
                m.append("Не сохранен пароль для этой учетной записи")
            }
            if item.username?.isEmpty ?? true {
                m.append("Не указан логин или почта")
            }
        }
        return m
    }
}
