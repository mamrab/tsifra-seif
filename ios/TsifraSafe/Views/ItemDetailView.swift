import SwiftUI

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

    @State private var isPasswordVisible: Bool = false
    @State private var isGeneratorPresented: Bool = false
    @State private var showDeleteConfirmation: Bool = false

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
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackground()

                ScrollView {
                    VStack(spacing: 16) {
                        // Title & Type Header
                        VStack(spacing: 12) {
                            HStack {
                                TextField("Название (напр. Google)", text: $title)
                                    .font(.system(size: 20, weight: .bold))
                                    .foregroundColor(.white)

                                Button(action: { favorite.toggle() }) {
                                    Image(systemName: favorite ? "star.fill" : "star")
                                        .font(.system(size: 20))
                                        .foregroundColor(favorite ? .yellow : .white.opacity(0.4))
                                }
                            }

                            // Type Picker
                            Picker("Тип", selection: $itemType) {
                                ForEach(VaultItemType.allCases) { t in
                                    Text(t.title).tag(t)
                                }
                            }
                            .pickerStyle(.segmented)
                        }
                        .padding(16)
                        .liquidGlassCard(cornerRadius: 20)

                        // Credentials Block
                        if itemType != .secureNote {
                            VStack(spacing: 12) {
                                glassInputField(title: "Логин / Email", value: $username, icon: "person.fill")

                                // Password with Reveal & Generator
                                VStack(alignment: .leading, spacing: 4) {
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
                                            .foregroundColor(.emeraldAccent)
                                        }
                                    }

                                    HStack {
                                        Image(systemName: "key.fill")
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
                                                UIPasteboard.general.string = password
                                                let impact = UINotificationFeedbackGenerator()
                                                impact.notificationOccurred(.success)
                                            }) {
                                                Image(systemName: "doc.on.doc.fill")
                                                    .foregroundColor(.emeraldAccent)
                                            }
                                        }
                                    }
                                }
                                .padding(12)
                                .background(Color.white.opacity(0.06))
                                .clipShape(RoundedRectangle(cornerRadius: 14))

                                glassInputField(title: "Веб-сайт", value: $url, icon: "link")
                            }
                            .padding(16)
                            .liquidGlassCard(cornerRadius: 20)
                        }

                        // Notes Block
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Защищенная заметка")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.white.opacity(0.6))

                            TextEditor(text: $notes)
                                .frame(minHeight: 120)
                                .font(.system(size: 14, design: .monospaced))
                                .foregroundColor(.white)
                                .scrollContentBackground(.hidden)
                                .padding(8)
                                .background(Color.white.opacity(0.06))
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                        .padding(16)
                        .liquidGlassCard(cornerRadius: 20)

                        // Delete Button (if editing existing item)
                        if originalItem != nil {
                            Button(role: .destructive, action: { showDeleteConfirmation = true }) {
                                HStack {
                                    Image(systemName: "trash.fill")
                                    Text("Удалить запись")
                                }
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.red.opacity(0.9))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.red.opacity(0.12))
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                            }
                            .padding(.top, 8)
                        }
                    }
                    .padding(20)
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
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.emeraldAccent)
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
                Text("Это действие невозможно отменить.")
            }
        }
    }

    private func glassInputField(title: String, value: Binding<String>, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.white.opacity(0.6))
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.white.opacity(0.4))
                    .frame(width: 20)
                TextField(title, text: value)
                    .font(.system(size: 14))
                    .foregroundColor(.white)
            }
        }
        .padding(12)
        .background(Color.white.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func saveRecord() {
        let item = VaultItem(
            id: originalItem?.id ?? UUID().uuidString,
            title: title.trimmingCharacters(in: .whitespaces),
            itemType: itemType,
            username: username.isEmpty ? nil : username,
            password: password.isEmpty ? nil : password,
            url: url.isEmpty ? nil : url,
            notes: notes.isEmpty ? nil : notes,
            category: category,
            tags: originalItem?.tags ?? [],
            favorite: favorite,
            customFields: originalItem?.customFields ?? [],
            createdAt: originalItem?.createdAt ?? Date(),
            updatedAt: Date()
        )
        try? vaultService.saveItem(item)
        dismiss()
    }
}
