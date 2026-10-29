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
                    VStack(spacing: 20) {
                        // Section 1: Biometrics & Security (Classic Apple Inset Grouped)
                        VStack(alignment: .leading, spacing: 10) {
                            Text("АВТОРИЗАЦИЯ И БЕЗОПАСНОСТЬ")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.white.opacity(0.55))
                                .padding(.horizontal, 4)

                            VStack(spacing: 14) {
                                HStack(spacing: 12) {
                                    AppleSquircleIcon(icon: BiometricsService.shared.biometricType.systemIcon, gradientColors: [Color.appleGreen, Color.emeraldAccent], size: 30)
                                    Text(BiometricsService.shared.biometricType.title)
                                        .font(.system(size: 15, weight: .medium))
                                        .foregroundColor(.white)
                                    Spacer()
                                    Toggle("", isOn: $biometricsEnabled)
                                        .tint(Color.appleBlue)
                                        .onChange(of: biometricsEnabled) { saveSettings() }
                                }

                                Divider().background(Color.white.opacity(0.08))

                                HStack(spacing: 12) {
                                    AppleSquircleIcon(icon: "app.badge.checkmark", gradientColors: [Color.appleBlue, Color.cyanAccent], size: 30)
                                    Text("Блокировка при сворачивании")
                                        .font(.system(size: 15, weight: .medium))
                                        .foregroundColor(.white)
                                    Spacer()
                                    Toggle("", isOn: $lockOnBackground)
                                        .tint(Color.appleBlue)
                                        .onChange(of: lockOnBackground) { saveSettings() }
                                }

                                Divider().background(Color.white.opacity(0.08))

                                HStack(spacing: 12) {
                                    AppleSquircleIcon(icon: "clock.fill", gradientColors: [Color.appleOrange, Color.appleYellow], size: 30)
                                    Text("Автоблокировка")
                                        .font(.system(size: 15, weight: .medium))
                                        .foregroundColor(.white)
                                    Spacer()
                                    Picker("", selection: $autoLockMinutes) {
                                        Text("1 мин").tag(1)
                                        Text("5 мин").tag(5)
                                        Text("15 мин").tag(15)
                                        Text("Никогда").tag(0)
                                    }
                                    .pickerStyle(.menu)
                                    .tint(.white.opacity(0.8))
                                    .onChange(of: autoLockMinutes) { saveSettings() }
                                }
                            }
                            .padding(16)
                            .liquidGlassCard(cornerRadius: 20)
                        }

                        // Section 2: Backup & Export
                        VStack(alignment: .leading, spacing: 10) {
                            Text("РЕЗЕРВНОЕ КОПИРОВАНИЕ")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.white.opacity(0.55))
                                .padding(.horizontal, 4)

                            VStack(spacing: 14) {
                                Button(action: exportBackup) {
                                    HStack(spacing: 12) {
                                        AppleSquircleIcon(icon: "square.and.arrow.up.fill", gradientColors: [Color.appleBlue, Color.cyanAccent], size: 30)
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text("Экспорт зашифрованного сейфа")
                                                .foregroundColor(.white)
                                                .font(.system(size: 15, weight: .medium))
                                            Text("Файл защищен AES-GCM 256-bit")
                                                .font(.system(size: 11))
                                                .foregroundColor(.white.opacity(0.5))
                                        }
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundColor(.white.opacity(0.3))
                                    }
                                }

                                Divider().background(Color.white.opacity(0.08))

                                Button(action: { isFileImporterPresented = true }) {
                                    HStack(spacing: 12) {
                                        AppleSquircleIcon(icon: "square.and.arrow.down.fill", gradientColors: [Color.appleIndigo, Color.purpleAccent], size: 30)
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text("Импорт из файла .tsvault")
                                                .foregroundColor(.white)
                                                .font(.system(size: 15, weight: .medium))
                                            Text("Восстановление базы записей")
                                                .font(.system(size: 11))
                                                .foregroundColor(.white.opacity(0.5))
                                        }
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundColor(.white.opacity(0.3))
                                    }
                                }
                            }
                            .padding(16)
                            .liquidGlassCard(cornerRadius: 20)
                        }

                        // Section 3: App Info & Architecture
                        VStack(spacing: 8) {
                            Text("Цифра-Сейф")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text("Версия 1.0 (iOS 27 Liquid Glass)")
                                .font(.system(size: 12))
                                .foregroundColor(.white.opacity(0.5))
                            Text("Apple CryptoKit • Zero-Knowledge • 100% Локально")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(Color.cyanAccent)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(20)
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
                        .font(.system(size: 15, weight: .bold))
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
        guard let data = try? vaultService.exportEncryptedBackup() else {
            alertMessage = "Сейф заблокирован. Разблокируйте хранилище перед экспортом."
            showAlert = true
            return
        }
        self.backupDataToShare = data
        self.isShareSheetPresented = true
    }

    private func importBackup(from url: URL) {
        do {
            let accessing = url.startAccessingSecurityScopedResource()
            defer { if accessing { url.stopAccessingSecurityScopedResource() } }
            let data = try Data(contentsOf: url)
            try vaultService.importEncryptedBackup(data: data)
            alertMessage = "Резервная копия успешно импортирована!"
            showAlert = true
        } catch {
            alertMessage = "Ошибка импорта: \(error.localizedDescription)"
            showAlert = true
        }
    }
}

#if canImport(UIKit)
struct ShareSheet: UIViewControllerRepresentable {
    var activityItems: [Any]
    var applicationActivities: [UIActivity]? = nil

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: applicationActivities)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
#endif
