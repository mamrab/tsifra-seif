import SwiftUI

public struct LockView: View {
    @ObservedObject var vaultService: CryptoVaultService

    @State private var enteredPin: String = ""
    @State private var confirmPin: String = ""
    @State private var isCreatingVault: Bool = false
    @State private var errorMessage: String?
    @State private var isAuthenticating: Bool = false
    @State private var showBiometricsButton: Bool = true

    public init(vaultService: CryptoVaultService) {
        self.vaultService = vaultService
        self._isCreatingVault = State(initialValue: !vaultService.isInitialized)
    }

    public var body: some View {
        ZStack {
            LiquidGlassBackground()

            VStack(spacing: 28) {
                Spacer(minLength: 20)

                // Shield Logo with Glow
                VStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 28, style: .continuous)
                            .fill(.ultraThinMaterial)
                            .frame(width: 88, height: 88)
                            .overlay(
                                RoundedRectangle(cornerRadius: 28, style: .continuous)
                                    .stroke(
                                        LinearGradient(
                                            colors: [Color.emeraldAccent.opacity(0.6), Color.white.opacity(0.1)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ),
                                        lineWidth: 1.5
                                    )
                            )
                            .shadow(color: Color.emeraldAccent.opacity(0.3), radius: 24, x: 0, y: 8)

                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 42, weight: .semibold))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.emeraldAccent, Color.cyanAccent],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    }

                    Text("Цифра-Сейф")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    Text(isCreatingVault ? "Создайте мастер-PIN (4-6 цифр)" : "Защищено Apple CryptoKit & Face ID")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                }

                // Error alert if any
                if let err = errorMessage {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                        Text(err)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.red.opacity(0.15))
                    .clipShape(Capsule())
                    .transition(.opacity)
                }

                // PIN Bullets
                HStack(spacing: 14) {
                    let targetLen = 6
                    ForEach(0..<targetLen, id: \.self) { idx in
                        Circle()
                            .fill(idx < enteredPin.count ? Color.emeraldAccent : Color.white.opacity(0.15))
                            .frame(width: 14, height: 14)
                            .overlay(
                                Circle()
                                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
                            )
                            .shadow(color: idx < enteredPin.count ? Color.emeraldAccent.opacity(0.6) : .clear, radius: 8)
                            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: enteredPin.count)
                    }
                }
                .padding(.vertical, 8)

                // Glass PIN Pad
                VStack(spacing: 14) {
                    ForEach(0..<3) { row in
                        HStack(spacing: 18) {
                            ForEach(1..<4) { col in
                                let num = row * 3 + col
                                pinButton("\(num)")
                            }
                        }
                    }

                    HStack(spacing: 18) {
                        // Left action: Face ID or Clear
                        if !isCreatingVault {
                            Button(action: triggerBiometrics) {
                                ZStack {
                                    Circle()
                                        .fill(.ultraThinMaterial)
                                        .frame(width: 72, height: 72)
                                        .overlay(Circle().stroke(Color.white.opacity(0.15), lineWidth: 1))
                                    Image(systemName: BiometricsService.shared.biometricType.systemIcon)
                                        .font(.system(size: 26, weight: .medium))
                                        .foregroundColor(.emeraldAccent)
                                }
                            }
                        } else {
                            Button(action: { enteredPin = "" }) {
                                ZStack {
                                    Circle()
                                        .fill(.ultraThinMaterial.opacity(0.5))
                                        .frame(width: 72, height: 72)
                                    Text("Сброс")
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundColor(.white.opacity(0.5))
                                }
                            }
                        }

                        pinButton("0")

                        // Right action: Backspace
                        Button(action: deleteDigit) {
                            ZStack {
                                Circle()
                                    .fill(.ultraThinMaterial.opacity(0.5))
                                    .frame(width: 72, height: 72)
                                    .overlay(Circle().stroke(Color.white.opacity(0.1), lineWidth: 1))
                                Image(systemName: "delete.left.fill")
                                    .font(.system(size: 20, weight: .medium))
                                    .foregroundColor(.white.opacity(0.8))
                            }
                        }
                    }
                }

                Spacer(minLength: 20)
            }
            .padding(.horizontal, 24)
        }
        .onAppear {
            if !isCreatingVault && vaultService.vaultData.settings.biometricsEnabled {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    triggerBiometrics()
                }
            }
        }
    }

    private func pinButton(_ digit: String) -> some View {
        Button(action: { appendDigit(digit) }) {
            ZStack {
                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 72, height: 72)
                    .overlay(
                        Circle()
                            .stroke(
                                LinearGradient(
                                    colors: [Color.white.opacity(0.25), Color.white.opacity(0.05)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
                    .shadow(color: Color.black.opacity(0.2), radius: 10, x: 0, y: 5)

                Text(digit)
                    .font(.system(size: 28, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
            }
        }
    }

    private func appendDigit(_ digit: String) {
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()

        guard enteredPin.count < 6 else { return }
        enteredPin.append(digit)

        if enteredPin.count >= 4 {
            // Check unlock or creation
            if !isCreatingVault {
                attemptUnlock()
            } else if enteredPin.count == 6 {
                createVaultWithPin()
            }
        }
    }

    private func deleteDigit() {
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()
        guard !enteredPin.isEmpty else { return }
        enteredPin.removeLast()
        errorMessage = nil
    }

    private func attemptUnlock() {
        do {
            try vaultService.unlock(password: enteredPin)
            let notify = UINotificationFeedbackGenerator()
            notify.notificationOccurred(.success)
        } catch {
            let notify = UINotificationFeedbackGenerator()
            notify.notificationOccurred(.error)
            errorMessage = "Неверный PIN"
            enteredPin = ""
        }
    }

    private func createVaultWithPin() {
        do {
            try vaultService.initialize(password: enteredPin)
            let notify = UINotificationFeedbackGenerator()
            notify.notificationOccurred(.success)
        } catch {
            errorMessage = error.localizedDescription
            enteredPin = ""
        }
    }

    private func triggerBiometrics() {
        Task {
            let result = await BiometricsService.shared.authenticate()
            await MainActor.run {
                switch result {
                case .success(let success):
                    if success, let token = vaultService.getSavedMasterToken() {
                        try? vaultService.unlock(password: token)
                    }
                case .failure(let err):
                    print("Biometrics error: \(err)")
                }
            }
        }
    }
}
