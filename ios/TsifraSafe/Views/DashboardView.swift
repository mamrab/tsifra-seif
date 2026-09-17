import SwiftUI

public struct DashboardView: View {
    @ObservedObject var vaultService: CryptoVaultService

    @State private var searchText: String = ""
    @State private var selectedCategory: String = "Все"
    @State private var selectedItem: VaultItem?
    @State private var isCreatingItem: Bool = false
    @State private var isGeneratorPresented: Bool = false
    @State private var isSettingsPresented: Bool = false
    @State private var copiedItemId: String?

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
                return matchesCategory && (titleMatch || userMatch || notesMatch)
            }
            return matchesCategory
        }
    }

    private var categories: [String] {
        ["Все"] + vaultService.vaultData.categories
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackground()

                VStack(spacing: 0) {
                    // Header Area
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Цифра-Сейф")
                                .font(.system(size: 26, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text("\(vaultService.vaultData.items.count) защищенных записей")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.white.opacity(0.6))
                        }

                        Spacer()

                        // Action Buttons: Generator, Settings, Lock
                        HStack(spacing: 10) {
                            headerIconButton(icon: "sparkles", color: .emeraldAccent) {
                                isGeneratorPresented = true
                            }

                            headerIconButton(icon: "gearshape.fill", color: .white.opacity(0.8)) {
                                isSettingsPresented = true
                            }

                            headerIconButton(icon: "lock.fill", color: .red.opacity(0.9)) {
                                vaultService.lock()
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 10)
                    .padding(.bottom, 14)

                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.white.opacity(0.5))
                        TextField("Поиск записей...", text: $searchText)
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
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )
                    .padding(.horizontal, 20)
                    .padding(.bottom, 12)

                    // Categories Horizontal Scroll
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(categories, id: \.self) { cat in
                                categoryPill(title: cat, isSelected: selectedCategory == cat) {
                                    let impact = UIImpactFeedbackGenerator(style: .light)
                                    impact.impactOccurred()
                                    selectedCategory = cat
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    .padding(.bottom, 14)

                    // Main Items List
                    if filteredItems.isEmpty {
                        Spacer()
                        VStack(spacing: 12) {
                            Image(systemName: "lock.slash.fill")
                                .font(.system(size: 44))
                                .foregroundColor(.white.opacity(0.2))
                            Text("Нет сохраненных записей")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white.opacity(0.8))
                            Text("Нажмите «+», чтобы сохранить первый пароль")
                                .font(.system(size: 12))
                                .foregroundColor(.white.opacity(0.5))
                        }
                        Spacer()
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 12) {
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

                // Floating «+» Create Button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: { isCreatingItem = true }) {
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.emeraldAccent, Color.cyanAccent],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 60, height: 60)
                                    .shadow(color: Color.emeraldAccent.opacity(0.4), radius: 16, x: 0, y: 6)

                                Image(systemName: "plus")
                                    .font(.system(size: 26, weight: .semibold))
                                    .foregroundColor(.black)
                            }
                        }
                        .padding(.trailing, 22)
                        .padding(.bottom, 22)
                    }
                }
            }
            .navigationBarHidden(true)
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
        }
    }

    private func headerIconButton(icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: {
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            action()
        }) {
            ZStack {
                Circle()
                    .fill(.ultraThinMaterial)
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
                .foregroundColor(isSelected ? .black : .white.opacity(0.8))
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(
                    isSelected
                        ? AnyView(LinearGradient(colors: [Color.emeraldAccent, Color.cyanAccent], startPoint: .leading, endPoint: .trailing))
                        : AnyView(Color.white.opacity(0.08))
                )
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(isSelected ? Color.clear : Color.white.opacity(0.1), lineWidth: 1)
                )
        }
    }

    private func itemGlassCard(_ item: VaultItem) -> some View {
        HStack(spacing: 14) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 44, height: 44)
                Image(systemName: item.itemType.systemIcon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.emeraldAccent)
            }

            // Info
            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(item.title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                    if item.favorite {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.yellow)
                    }
                }

                Text(item.username ?? (item.notes?.components(separatedBy: "\n").first ?? item.category))
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(.white.opacity(0.5))
                    .lineLimit(1)
            }

            Spacer()

            // Quick Copy Action Button
            if let pass = item.password, !pass.isEmpty {
                Button(action: {
                    UIPasteboard.general.string = pass
                    let impact = UINotificationFeedbackGenerator()
                    impact.notificationOccurred(.success)
                    copiedItemId = item.id
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                        if copiedItemId == item.id { copiedItemId = nil }
                    }
                }) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(copiedItemId == item.id ? Color.emeraldAccent.opacity(0.3) : Color.white.opacity(0.08))
                            .frame(width: 36, height: 36)
                        Image(systemName: copiedItemId == item.id ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(copiedItemId == item.id ? .emeraldAccent : .white.opacity(0.7))
                    }
                }
            }
        }
        .padding(14)
        .liquidGlassCard(cornerRadius: 18)
    }
}
