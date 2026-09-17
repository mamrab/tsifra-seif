import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct DashboardView: View {
    @ObservedObject var vaultService: CryptoVaultService

    @State private var searchText: String = ""
    @State private var selectedCategory: String = "Все"
    @State private var selectedItem: VaultItem?
    @State private var isCreatingItem: Bool = false
    @State private var isGeneratorPresented: Bool = false
    @State private var isSettingsPresented: Bool = false
    @State private var copiedItemId: String?
    @State private var showForgottenHintsSheet: Bool = false

    public init(vaultService: CryptoVaultService) {
        self.vaultService = vaultService
    }

    private var filteredItems: [VaultItem] {
        vaultService.vaultData.items.filter { item in
            let matchesCategory = selectedCategory == "Все" || item.category == selectedCategory
            if !searchText.isEmpty {
                let q = searchText.lowercased()
                let titleMatch = item.title.lowercased().contains(q)
                let userMatch = item.username?.lowercased().contains(q) ?? false
                let notesMatch = item.notes?.lowercased().contains(q) ?? false
                let cryptoMatch = item.cryptoData?.words.contains(where: { $0.lowercased().contains(q) }) ?? false
                let addrMatch = item.cryptoData?.address?.lowercased().contains(q) ?? false
                return matchesCategory && (titleMatch || userMatch || notesMatch || cryptoMatch || addrMatch)
            }
            return matchesCategory
        }
    }

    private var categories: [String] {
        ["Все"] + vaultService.vaultData.categories
    }

    // Identify what user forgot
    private var forgottenCount: Int {
        var count = 0
        for item in vaultService.vaultData.items {
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

                VStack(spacing: 0) {
                    // Monochrome Header
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Цифра-Сейф")
                                .font(.system(size: 24, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text("\(vaultService.vaultData.items.count) защищенных записей")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.white.opacity(0.5))
                        }

                        Spacer()

                        // Action Buttons: Generator, Settings, Lock
                        HStack(spacing: 10) {
                            headerIconButton(icon: "sparkles", color: .white) {
                                isGeneratorPresented = true
                            }

                            headerIconButton(icon: "gearshape.fill", color: .white.opacity(0.85)) {
                                isSettingsPresented = true
                            }

                            headerIconButton(icon: "lock.fill", color: .white.opacity(0.7)) {
                                vaultService.lock()
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 12)

                    // Forgotten hints top banner
                    if forgottenCount > 0 && searchText.isEmpty {
                        Button(action: { showForgottenHintsSheet = true }) {
                            HStack(spacing: 10) {
                                Image(systemName: "lightbulb.fill")
                                    .font(.system(size: 13))
                                    .foregroundColor(.white)

                                Text("Что вы забыли: \(forgottenCount) рекомендаций по безопасности")
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(.white.opacity(0.9))
                                    .lineLimit(1)

                                Spacer()

                                Image(systemName: "chevron.right")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.5))
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Color(white: 0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(Color.white.opacity(0.12), lineWidth: 1)
                            )
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 10)
                    }

                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.white.opacity(0.4))
                        TextField("Поиск записей, seed, ключей...", text: $searchText)
                            .foregroundColor(.white)
                            .font(.system(size: 14))
                        if !searchText.isEmpty {
                            Button(action: { searchText = "" }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.white.opacity(0.5))
                            }
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(Color(white: 0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )
                    .padding(.horizontal, 20)
                    .padding(.bottom, 12)

                    // Categories Horizontal Scroll
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(categories, id: \.self) { cat in
                                categoryPill(title: cat, isSelected: selectedCategory == cat) {
                                    #if canImport(UIKit)
                                    let impact = UIImpactFeedbackGenerator(style: .light)
                                    impact.impactOccurred()
                                    #endif
                                    selectedCategory = cat
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    .padding(.bottom, 12)

                    // Main Items List
                    if filteredItems.isEmpty {
                        Spacer()
                        VStack(spacing: 12) {
                            Image(systemName: "lock.shield")
                                .font(.system(size: 44))
                                .foregroundColor(.white.opacity(0.25))
                            Text("Нет сохраненных записей")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white.opacity(0.8))
                            Text("Нажмите «+», чтобы создать первую запись")
                                .font(.system(size: 12))
                                .foregroundColor(.white.opacity(0.5))
                        }
                        Spacer()
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 10) {
                                ForEach(filteredItems) { item in
                                    itemGlassCard(item)
                                        .onTapGesture {
                                            selectedItem = item
                                        }
                                }
                            }
                            .padding(.horizontal, 20)
                            .padding(.bottom, 90)
                        }
                    }
                }

                // Floating Action Button (+)
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: {
                            isCreatingItem = true
                        }) {
                            ZStack {
                                Circle()
                                    .fill(Color.white)
                                    .frame(width: 56, height: 56)
                                    .shadow(color: Color.black.opacity(0.6), radius: 14, x: 0, y: 6)
                                Image(systemName: "plus")
                                    .font(.system(size: 22, weight: .bold))
                                    .foregroundColor(.black)
                            }
                        }
                        .padding(.trailing, 20)
                        .padding(.bottom, 20)
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

    private func headerIconButton(icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: {
            #if canImport(UIKit)
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            #endif
            action()
        }) {
            ZStack {
                Circle()
                    .fill(Color(white: 0.1))
                    .frame(width: 38, height: 38)
                    .overlay(Circle().stroke(Color.white.opacity(0.12), lineWidth: 1))
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(color)
            }
        }
    }

    private func categoryPill(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: isSelected ? .semibold : .medium))
                .foregroundColor(isSelected ? .black : .white.opacity(0.75))
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isSelected ? Color.white : Color(white: 0.1))
                .clipShape(Capsule())
                .overlay(
                    Capsule().stroke(isSelected ? Color.clear : Color.white.opacity(0.12), lineWidth: 1)
                )
        }
    }

    private func itemGlassCard(_ item: VaultItem) -> some View {
        HStack(spacing: 14) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color(white: 0.1))
                    .frame(width: 44, height: 44)
                Image(systemName: item.itemType.systemIcon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
            }

            // Info
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(item.title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                    if item.favorite {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.white)
                    }
                    if item.itemType == .cryptoWallet && item.cryptoData?.privateKey != nil {
                        Text("PK")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1)
                            .background(Color.white)
                            .foregroundColor(.black)
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                    }
                }

                if item.itemType == .cryptoWallet {
                    Text(item.cryptoData?.network ?? "Криптокошелек")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.white.opacity(0.5))
                        .lineLimit(1)
                } else {
                    Text(item.username ?? (item.notes?.components(separatedBy: "\n").first ?? item.category))
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundColor(.white.opacity(0.5))
                        .lineLimit(1)
                }
            }

            Spacer()

            // Quick Copy Action Button
            if item.itemType == .cryptoWallet, let words = item.cryptoData?.words, !words.isEmpty {
                Button(action: {
                    #if canImport(UIKit)
                    UIPasteboard.general.string = words.joined(separator: " ")
                    let impact = UINotificationFeedbackGenerator()
                    impact.notificationOccurred(.success)
                    #endif
                    copiedItemId = item.id
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                        if copiedItemId == item.id { copiedItemId = nil }
                    }
                }) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(copiedItemId == item.id ? Color.white : Color(white: 0.1))
                            .frame(width: 44, height: 32)
                        Text(copiedItemId == item.id ? "✓" : "Seed")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(copiedItemId == item.id ? .black : .white.opacity(0.8))
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
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                        if copiedItemId == item.id { copiedItemId = nil }
                    }
                }) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(copiedItemId == item.id ? Color.white : Color(white: 0.1))
                            .frame(width: 36, height: 36)
                        Image(systemName: copiedItemId == item.id ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(copiedItemId == item.id ? .black : .white.opacity(0.85))
                    }
                }
            }
        }
        .padding(14)
        .liquidGlassCard(cornerRadius: 18)
    }

    private var forgottenHintsView: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackground()

                ScrollView {
                    VStack(spacing: 14) {
                        ForEach(vaultService.vaultData.items) { item in
                            let missingList = getMissingFields(for: item)
                            if !missingList.isEmpty {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Image(systemName: item.itemType.systemIcon)
                                            .foregroundColor(.white)
                                        Text(item.title)
                                            .font(.system(size: 15, weight: .semibold))
                                            .foregroundColor(.white)
                                        Spacer()
                                        Button("Исправить") {
                                            showForgottenHintsSheet = false
                                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                                selectedItem = item
                                            }
                                        }
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundColor(.black)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 4)
                                        .background(Color.white)
                                        .clipShape(Capsule())
                                    }

                                    ForEach(missingList, id: \.self) { hint in
                                        HStack(spacing: 6) {
                                            Image(systemName: "exclamationmark.circle")
                                                .font(.system(size: 11))
                                                .foregroundColor(.white.opacity(0.6))
                                            Text(hint)
                                                .font(.system(size: 12))
                                                .foregroundColor(.white.opacity(0.6))
                                        }
                                    }
                                }
                                .padding(14)
                                .liquidGlassCard(cornerRadius: 16)
                            }
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Что вы забыли")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Закрыть") { showForgottenHintsSheet = false }
                        .foregroundColor(.white)
                }
            }
        }
    }

    private func getMissingFields(for item: VaultItem) -> [String] {
        var res: [String] = []
        if item.itemType == .cryptoWallet {
            let wordsCount = item.cryptoData?.words.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }.count ?? 0
            let targetCount = item.cryptoData?.wordCount ?? 12
            let hasPk = !(item.cryptoData?.privateKey?.trimmingCharacters(in: .whitespaces).isEmpty ?? true)
            if wordsCount == 0 && !hasPk {
                res.append("Забыли ввести Seed-слова (\(targetCount) слов) или Private Key")
            } else if wordsCount > 0 && wordsCount < targetCount {
                res.append("Заполнено только \(wordsCount) из \(targetCount) слов")
            }
            if item.cryptoData?.address?.trimmingCharacters(in: .whitespaces).isEmpty ?? true {
                res.append("Не указан публичный адрес кошелька")
            }
        } else if item.itemType != .secureNote {
            if item.password?.isEmpty ?? true {
                res.append("Не указан пароль")
            }
            if item.username?.isEmpty ?? true {
                res.append("Не указан логин / email")
            }
            if item.itemType == .password && (item.url?.isEmpty ?? true) {
                res.append("Совет: укажите URL сайта")
            }
        }
        return res
    }
}
