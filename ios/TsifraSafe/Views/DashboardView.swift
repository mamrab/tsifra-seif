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
                    // Apple iOS 27 Liquid Glass Top Header
                    HStack(spacing: 12) {
                        // Mini glowing squircle logo
                        ZStack {
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(.ultraThinMaterial)
                                .frame(width: 36, height: 36)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(
                                            LinearGradient(
                                                colors: [Color.white.opacity(0.6), Color.cyanAccent.opacity(0.3)],
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            ),
                                            lineWidth: 1
                                        )
                                )
                            Image(systemName: "lock.shield.fill")
                                .font(.system(size: 18))
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [Color.white, Color.cyanAccent],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                                )
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Цифра-Сейф")
                                .font(.system(size: 20, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text("\(vaultService.vaultData.items.count) защищенных записей")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(.white.opacity(0.6))
                        }

                        Spacer()

                        // Action Buttons: Generator, Settings, Lock (Glass Discs)
                        HStack(spacing: 8) {
                            LiquidGlassIconButton(icon: "sparkles", color: .cyanAccent, size: 36) {
                                isGeneratorPresented = true
                            }

                            LiquidGlassIconButton(icon: "gearshape.fill", color: .white.opacity(0.9), size: 36) {
                                isSettingsPresented = true
                            }

                            LiquidGlassIconButton(icon: "lock.fill", color: Color(red: 0.98, green: 0.36, blue: 0.36), size: 36) {
                                vaultService.lock()
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 12)

                    // Forgotten hints top banner (Liquid Amber Glass)
                    if forgottenCount > 0 && searchText.isEmpty {
                        Button(action: { showForgottenHintsSheet = true }) {
                            HStack(spacing: 10) {
                                Image(systemName: "lightbulb.fill")
                                    .font(.system(size: 13))
                                    .foregroundColor(Color.amberAccent)

                                Text("Что вы забыли: \(forgottenCount) рекомендаций по защите")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.95))
                                    .lineLimit(1)

                                Spacer()

                                Image(systemName: "chevron.right")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.55))
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(
                                ZStack {
                                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                                        .fill(.ultraThinMaterial)
                                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                                        .fill(Color.amberAccent.opacity(0.12))
                                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                                        .stroke(
                                            LinearGradient(
                                                colors: [Color.amberAccent.opacity(0.6), Color.amberAccent.opacity(0.15)],
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            ),
                                            lineWidth: 1.0
                                        )
                                }
                            )
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 12)
                    }

                    // Search Bar (Apple Liquid Glass Capsule)
                    HStack(spacing: 10) {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.white.opacity(0.5))
                            .font(.system(size: 14))

                        TextField("Поиск записей, seed, ключей...", text: $searchText)
                            .foregroundColor(.white)
                            .font(.system(size: 14))

                        if !searchText.isEmpty {
                            Button(action: { searchText = "" }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.white.opacity(0.6))
                            }
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 11)
                    .liquidGlassInput(cornerRadius: 16)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 12)

                    // Categories Horizontal Scroll (Liquid Glass Pills)
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
                        VStack(spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(.ultraThinMaterial)
                                    .frame(width: 80, height: 80)
                                    .overlay(
                                        Circle()
                                            .stroke(Color.white.opacity(0.18), lineWidth: 1)
                                    )
                                Image(systemName: "lock.shield")
                                    .font(.system(size: 38))
                                    .foregroundColor(.white.opacity(0.35))
                            }

                            Text("Нет сохраненных записей")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white.opacity(0.85))

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
                            .padding(.bottom, 95)
                        }
                    }
                }

                // Floating Action Button (+) — Liquid Glass Sphere
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: {
                            isCreatingItem = true
                        }) {
                            ZStack {
                                // Ambient Glow
                                Circle()
                                    .fill(Color.cyanAccent.opacity(0.40))
                                    .frame(width: 62, height: 62)
                                    .blur(radius: 12)

                                // Glass Orb
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.white, Color(red: 0.90, green: 0.94, blue: 0.99)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 58, height: 58)
                                    .overlay(
                                        Circle()
                                            .stroke(Color.white, lineWidth: 1.5)
                                    )
                                    .shadow(color: Color.black.opacity(0.35), radius: 12, x: 0, y: 6)

                                Image(systemName: "plus")
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.black)
                            }
                        }
                        .padding(.trailing, 22)
                        .padding(.bottom, 22)
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

    private func categoryPill(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: isSelected ? .semibold : .medium))
                .foregroundColor(isSelected ? .black : .white.opacity(0.80))
                .padding(.horizontal, 15)
                .padding(.vertical, 8)
                .background(
                    ZStack {
                        if isSelected {
                            LinearGradient(
                                colors: [Color.white, Color(red: 0.92, green: 0.94, blue: 0.98)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        } else {
                            Capsule().fill(.ultraThinMaterial)
                        }
                    }
                )
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(
                            isSelected ? Color.clear : Color.white.opacity(0.20),
                            lineWidth: 1.0
                        )
                )
        }
    }

    private func itemGlassCard(_ item: VaultItem) -> some View {
        HStack(spacing: 14) {
            // Refractive Glass Icon Tile
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .frame(width: 46, height: 46)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(
                                LinearGradient(
                                    colors: [Color.white.opacity(0.40), Color.white.opacity(0.10)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1.0
                            )
                    )

                Image(systemName: item.itemType.systemIcon)
                    .font(.system(size: 19, weight: .semibold))
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
                            .foregroundColor(Color.amberAccent)
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
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.white.opacity(0.60))
                        .lineLimit(1)
                } else {
                    Text(item.username ?? (item.notes?.components(separatedBy: "\n").first ?? item.category))
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundColor(.white.opacity(0.60))
                        .lineLimit(1)
                }
            }

            Spacer()

            // Quick Copy Action Button (Liquid Glass Mini Pill)
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
                            .fill(copiedItemId == item.id ? AnyShapeStyle(Color.white) : AnyShapeStyle(.ultraThinMaterial))
                            .frame(width: 48, height: 32)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(Color.white.opacity(0.25), lineWidth: 1)
                            )
                        Text(copiedItemId == item.id ? "✓" : "Seed")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(copiedItemId == item.id ? .black : .white.opacity(0.90))
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
                            .fill(copiedItemId == item.id ? AnyShapeStyle(Color.white) : AnyShapeStyle(.ultraThinMaterial))
                            .frame(width: 36, height: 36)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(Color.white.opacity(0.25), lineWidth: 1)
                            )
                        Image(systemName: copiedItemId == item.id ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(copiedItemId == item.id ? .black : .white.opacity(0.90))
                    }
                }
            }
        }
        .padding(14)
        .liquidGlassCard(cornerRadius: 20)
    }

    private var forgottenHintsView: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackground()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Рекомендации ассистента")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.top, 12)

                        Text("Анализ хранилища показал поля, которые вы могли случайно забыть заполнить:")
                            .font(.system(size: 13))
                            .foregroundColor(.white.opacity(0.65))

                        ForEach(vaultService.vaultData.items) { item in
                            let missing = missingFields(for: item)
                            if !missing.isEmpty {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Image(systemName: item.itemType.systemIcon)
                                            .foregroundColor(.cyanAccent)
                                        Text(item.title)
                                            .font(.system(size: 15, weight: .bold))
                                            .foregroundColor(.white)
                                        Spacer()
                                        Text(item.category)
                                            .font(.system(size: 10, weight: .semibold))
                                            .foregroundColor(.white.opacity(0.6))
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(.ultraThinMaterial)
                                            .clipShape(Capsule())
                                    }

                                    ForEach(missing, id: \.self) { m in
                                        HStack(alignment: .top, spacing: 6) {
                                            Image(systemName: "exclamationmark.circle.fill")
                                                .font(.system(size: 12))
                                                .foregroundColor(Color.amberAccent)
                                                .padding(.top, 2)
                                            Text(m)
                                                .font(.system(size: 13))
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
            .navigationTitle("Что вы забыли")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Готово") {
                        showForgottenHintsSheet = false
                    }
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
                m.append("Seed-фраза заполнена не полностью (\(filledCount) слов)")
            }
            if (item.cryptoData?.address?.trimmingCharacters(in: .whitespaces).isEmpty ?? true) {
                m.append("Не указан публичный адрес кошелька для сверки")
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
