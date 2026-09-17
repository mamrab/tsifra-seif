import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var vaultService: CryptoVaultService

    @State private var biometricsEnabled: Bool
    @State private var lockOnBackground: Bool
    @State private var autoLockMinutes: Int

    @State private var isShareSheetPresented: Bool = false
    @State private var backupDataToShare: Data?
    @State private var isFileImporterPresented: Bool = false
    @State private var alertMessage: String?
    @State private var showAlert: Bool = false

    public init(vaultService: CryptoVaultService) {
        self.vaultService = vaultService
        let settings = vaultService.vaultData.settings
        _biometricsEnabled = State(initialValue: settings.biometricsEnabled)
        _lockOnBackground = State(initialValue: settings.lockOnBackground)
        _autoLockMinutes = State(initialValue: settings.autoLockMinutes)
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackground()

                ScrollView {
                    VStack(spacing: 18) {
                        // Biometrics & Security Section
                        VStack(spacing: 14) {
                            HStack {
                                Image(systemName: BiometricsService.shared.biometricType.systemIcon)
                                    .foregroundColor(.white)
                                    .frame(width: 24)
                                Text(BiometricsService.shared.biometricType.title)
                                    .foregroundColor(.white)
                                Spacer()
                                Toggle("", isOn: $biometricsEnabled)
                                    .tint(.white)
                                    .onChange(of: biometricsEnabled) { saveSettings() }
                            }

                            Divider().background(Color.white.opacity(0.1))

                            HStack {
                                Image(systemName: "app.badge.checkmark")
                                    .foregroundColor(.white.opacity(0.85))
                                    .frame(width: 24)
                                Text("Блокировка при сворачивании")
                                    .foregroundColor(.white)
                                Spacer()
                                Toggle("", isOn: $lockOnBackground)
                                    .tint(.white)
                                    .onChange(of: lockOnBackground) { saveSettings() }
                            }

                            Divider().background(Color.white.opacity(0.1))

                            HStack {
                                Image(systemName: "clock.fill")
                                    .foregroundColor(.white.opacity(0.7))
                                    .frame(width: 24)
                                Text("Таймер автоблокировки")
                                    .foregroundColor(.white)
                                Spacer()
                                Picker("", selection: $autoLockMinutes) {
                                    Text("1 мин").tag(1)
                                    Text("5 мин").tag(5)
                                    Text("15 мин").tag(15)
                                    Text("Выкл").tag(0)
                                }
                                .pickerStyle(.menu)
                                .tint(.white)
                                .onChange(of: autoLockMinutes) { saveSettings() }
                            }
                        }
                        .padding(18)
                        .liquidGlassCard(cornerRadius: 20)

                        // Backup & Export Section
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Резервное копирование")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white.opacity(0.6))
                                .padding(.horizontal, 4)

                            Button(action: exportBackup) {
                                HStack {
                                    Image(systemName: "square.and.arrow.up.fill")
                                        .foregroundColor(.white)
                                        .frame(width: 24)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Экспорт зашифрованного сейфа")
                                            .foregroundColor(.white)
                                            .font(.system(size: 14, weight: .medium))
                                        Text("Файл защищен AES-GCM")
                                            .font(.system(size: 11))
                                            .foregroundColor(.white.opacity(0.5))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 12))
                                        .foregroundColor(.white.opacity(0.3))
                                }
                            }

                            Divider().background(Color.white.opacity(0.1))

                            Button(action: { isFileImporterPresented = true }) {
                                HStack {
                                    Image(systemName: "square.and.arrow.down.fill")
                                        .foregroundColor(.white.opacity(0.85))
                                        .frame(width: 24)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Импорт из файла .tsvault")
                                            .foregroundColor(.white)
                                            .font(.system(size: 14, weight: .medium))
                                        Text("Восстановление всех записей")
                                            .font(.system(size: 11))
                                            .foregroundColor(.white.opacity(0.5))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 12))
                                        .foregroundColor(.white.opacity(0.3))
                                }
                            }
                        }
                        .padding(18)
                        .liquidGlassCard(cornerRadius: 20)

                        // About Card
                        VStack(spacing: 6) {
                            Text("Цифра-Сейф для iOS")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                            Text("Версия 1.0 • Apple CryptoKit & Pure Monochrome")
                                .font(.system(size: 11))
                                .foregroundColor(.white.opacity(0.5))
                            Text("100% Локально. Без серверов.")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(16)
                        .liquidGlassCard(cornerRadius: 18)
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Настройки")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Готово") { dismiss() }
                        .foregroundColor(.white)
                }
            }
            .sheet(isPresented: $isShareSheetPresented) {
                if let data = backupDataToShare {
                    ShareSheet(activityItems: [data])
                }
            }
            .fileImporter(
                isPresented: $isFileImporterPresented,
                allowedContentTypes: [.data],
                allowsMultipleSelection: false
            ) { result in
                switch result {
                case .success(let urls):
                    if let selectedURL = urls.first {
                        importBackup(from: selectedURL)
                    }
                case .failure(let err):
                    alertMessage = err.localizedDescription
                    showAlert = true
                }
            }
            .alert("Уведомление", isPresented: $showAlert) {
                Button("ОК", role: .cancel) {}
            } message: {
                Text(alertMessage ?? "")
            }
        }
    }

    private func saveSettings() {
        let updated = VaultSettings(
            autoLockMinutes: autoLockMinutes,
            lockOnBackground: lockOnBackground,
            biometricsEnabled: biometricsEnabled,
            clipboardClearSeconds: vaultService.vaultData.settings.clipboardClearSeconds
        )
        try? vaultService.updateSettings(updated)
    }

    private func exportBackup() {
        do {
            let data = try vaultService.exportEncryptedBackup()
            self.backupDataToShare = data
            self.isShareSheetPresented = true
        } catch {
            alertMessage = "Ошибка экспорта: \(error.localizedDescription)"
            showAlert = true
        }
    }

    private func importBackup(from url: URL) {
        do {
            let data = try Data(contentsOf: url)
            if let token = vaultService.getSavedMasterToken() {
                try vaultService.importEncryptedBackup(data: data, password: token)
                alertMessage = "Сейф успешно восстановлен!"
                showAlert = true
            }
        } catch {
            alertMessage = "Ошибка импорта: \(error.localizedDescription)"
            showAlert = true
        }
    }
}

#if canImport(UIKit)
public struct ShareSheet: UIViewControllerRepresentable {
    public let activityItems: [Any]

    public func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }

    public func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
#else
public struct ShareSheet: View {
    public let activityItems: [Any]
    public var body: some View {
        Text("Поделиться")
    }
}
#endif
