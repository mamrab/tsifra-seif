import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct LockView: View {
    @ObservedObject var vaultService: CryptoVaultService

    @State private var enteredPin: String = ""
    @State private var isCreatingVault: Bool = false
    @State private var errorMessage: String?
    @State private var isAuthenticating: Bool = false
    @State private var pinLength: Int = 4 // 4 or 6 digits
    @State private var useTextPassword: Bool = false
    @State private var showForgotHelp: Bool = false
    @State private var showResetConfirm: Bool = false
    @State private var isShaking: Bool = false

    public init(vaultService: CryptoVaultService) {
        self.vaultService = vaultService
        self._isCreatingVault = State(initialValue: !vaultService.isInitialized)
    }

    public var body: some View {
        ZStack {
            LiquidGlassBackground()

            VStack(spacing: 20) {
                Spacer(minLength: 10)

                // iOS 27 Glowing Cipher Logo (Liquid Glass Squircle)
                VStack(spacing: 12) {
                    ZStack {
                        // Ambient Radial Glow
                        Circle()
                            .fill(Color.cyanAccent.opacity(0.35))
                            .frame(width: 86, height: 86)
                            .blur(radius: 20)

                        // Glass Squircle
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .fill(.ultraThinMaterial)
                            .frame(width: 76, height: 76)
                            .overlay(
                                RoundedRectangle(cornerRadius: 24, style: .continuous)
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.white.opacity(0.20), Color.white.opacity(0.04)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 24, style: .continuous)
                                    .stroke(
                                        LinearGradient(
                                            colors: [
                                                Color.white.opacity(0.65),
                                                Color.cyanAccent.opacity(0.40),
                                                Color.white.opacity(0.15)
                                            ],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ),
                                        lineWidth: 1.2
                                    )
                            )
                            .shadow(color: Color.black.opacity(0.5), radius: 18, x: 0, y: 8)

                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 36, weight: .semibold))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.white, Color.cyanAccent],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                    }

                    Text("Цифра-Сейф")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .shadow(color: Color.black.opacity(0.4), radius: 6, x: 0, y: 2)

                    Text(isCreatingVault
                         ? "Задайте новый мастер-PIN (\(pinLength) цифр)"
                         : "Безопасное Zero-Knowledge хранилище")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white.opacity(0.70))
                }

                // Error message banner
                if let err = errorMessage {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.white)
                            .font(.system(size: 12))
                        Text(err)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
                    .overlay(
                        Capsule()
                            .stroke(Color.red.opacity(0.6), lineWidth: 1)
                    )
                    .transition(.opacity)
                }

                // PIN Length & Mode Selector (Liquid Glass Pills)
                HStack(spacing: 8) {
                    modePill(title: "4 цифры", isSelected: pinLength == 4 && !useTextPassword) {
                        pinLength = 4
                        enteredPin = ""
                        errorMessage = nil
                        useTextPassword = false
                    }

                    modePill(title: "6 цифр", isSelected: pinLength == 6 && !useTextPassword) {
                        pinLength = 6
                        enteredPin = ""
                        errorMessage = nil
                        useTextPassword = false
                    }

                    modePill(title: useTextPassword ? "PIN-код" : "Пароль", isSelected: useTextPassword) {
                        useTextPassword.toggle()
                        enteredPin = ""
                        errorMessage = nil
                    }
                }

                if !useTextPassword {
                    // Luminous Glass PIN Bullets
                    HStack(spacing: 18) {
                        ForEach(0..<pinLength, id: \.self) { idx in
                            Circle()
                                .fill(
                                    idx < enteredPin.count
                                        ? AnyShapeStyle(LinearGradient(colors: [Color.white, Color.cyanAccent], startPoint: .top, endPoint: .bottom))
                                        : AnyShapeStyle(Color.white.opacity(0.14))
                                )
                                .frame(width: 16, height: 16)
                                .overlay(
                                    Circle()
                                        .stroke(idx < enteredPin.count ? Color.white : Color.white.opacity(0.35), lineWidth: 1.2)
                                )
                                .shadow(color: idx < enteredPin.count ? Color.cyanAccent.opacity(0.8) : Color.clear, radius: 10)
                                .scaleEffect(idx < enteredPin.count ? 1.25 : 1.0)
                                .animation(.spring(response: 0.25, dampingFraction: 0.65), value: enteredPin.count)
                        }
                    }
                    .padding(.vertical, 6)
                    .offset(x: isShaking ? -10 : 0)
                    .animation(.default.repeatCount(3, autoreverses: true).speed(4), value: isShaking)

                    // Numeric Pad (Authentic Apple Liquid Glass Discs)
                    VStack(spacing: 14) {
                        HStack(spacing: 22) {
                            keypadButton("1", "")
                            keypadButton("2", "ABC")
                            keypadButton("3", "DEF")
                        }
                        HStack(spacing: 22) {
                            keypadButton("4", "GHI")
                            keypadButton("5", "JKL")
                            keypadButton("6", "MNO")
                        }
                        HStack(spacing: 22) {
                            keypadButton("7", "PQRS")
                            keypadButton("8", "TUV")
                            keypadButton("9", "WXYZ")
                        }
                        HStack(spacing: 22) {
                            // Left action: Face ID or Reset Pad
                            if !isCreatingVault {
                                Button(action: triggerBiometrics) {
                                    ZStack {
                                        Circle()
                                            .fill(.ultraThinMaterial)
                                            .frame(width: 72, height: 72)
                                        Circle()
                                            .fill(Color.white.opacity(0.08))
                                            .frame(width: 72, height: 72)
                                        Circle()
                                            .stroke(
                                                LinearGradient(
                                                    colors: [Color.white.opacity(0.40), Color.white.opacity(0.10)],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                ),
                                                lineWidth: 1.0
                                            )
                                            .frame(width: 72, height: 72)
                                        Image(systemName: BiometricsService.shared.biometricType.systemIcon)
                                            .font(.system(size: 26, weight: .medium))
                                            .foregroundColor(.white)
                                    }
                                }
                            } else {
                                Button(action: { enteredPin = ""; errorMessage = nil }) {
                                    ZStack {
                                        Circle()
                                            .fill(.ultraThinMaterial)
                                            .frame(width: 72, height: 72)
                                        Circle()
                                            .stroke(Color.white.opacity(0.18), lineWidth: 1.0)
                                            .frame(width: 72, height: 72)
                                        Text("Сброс")
                                            .font(.system(size: 13, weight: .medium))
                                            .foregroundColor(.white.opacity(0.7))
                                    }
                                }
                            }

                            keypadButton("0", "+")

                            // Right action: Backspace
                            Button(action: deleteDigit) {
                                ZStack {
                                    Circle()
                                        .fill(.ultraThinMaterial)
                                        .frame(width: 72, height: 72)
                                    Circle()
                                        .fill(Color.white.opacity(0.06))
                                        .frame(width: 72, height: 72)
                                    Circle()
                                        .stroke(
                                            LinearGradient(
                                                colors: [Color.white.opacity(0.40), Color.white.opacity(0.10)],
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            ),
                                            lineWidth: 1.0
                                        )
                                        .frame(width: 72, height: 72)
                                    Image(systemName: "delete.left.fill")
                                        .font(.system(size: 20, weight: .medium))
                                        .foregroundColor(.white.opacity(0.90))
                                }
                            }
                        }
                    }

                    // Optional Manual Submit button if digits entered
                    if enteredPin.count >= 4 {
                        Button(action: {
                            if !isCreatingVault {
                                attemptUnlock(force: true)
                            } else {
                                createVaultWithPin()
                            }
                        }) {
                            Text(isCreatingVault ? "Создать сейф" : "Разблокировать (\(enteredPin.count) цифр)")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.black)
                                .padding(.horizontal, 22)
                                .padding(.vertical, 10)
                                .background(
                                    LinearGradient(
                                        colors: [Color.white, Color(red: 0.92, green: 0.94, blue: 0.98)],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                                )
                                .clipShape(Capsule())
                                .shadow(color: Color.white.opacity(0.25), radius: 10, x: 0, y: 4)
                        }
                        .transition(.opacity)
                    }
                } else {
                    // Full text password input mode (Liquid Glass Input)
                    VStack(spacing: 16) {
                        SecureField("Введите мастер-пароль...", text: $enteredPin)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 16)
                            .liquidGlassInput(cornerRadius: 16)
                            .foregroundColor(.white)
                            .font(.system(size: 16, design: .monospaced))

                        LiquidGlassButton(
                            title: isCreatingVault ? "Создать сейф" : "Разблокировать",
                            systemIcon: "lock.open.fill"
                        ) {
                            if !isCreatingVault {
                                attemptUnlock(force: true)
                            } else {
                                createVaultWithPin()
                            }
                        }
                        .disabled(enteredPin.isEmpty)
                    }
                    .padding(.horizontal, 10)
                }

                // Help & Forgot Password Button
                HStack(spacing: 16) {
                    Button(action: { showForgotHelp = true }) {
                        HStack(spacing: 4) {
                            Image(systemName: "questionmark.circle")
                            Text("Забыли PIN?")
                        }
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                    }

                    Text("•").foregroundColor(.white.opacity(0.2))

                    Button(action: { showResetConfirm = true }) {
                        Text("Сбросить сейф")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white.opacity(0.6))
                    }
                }
                .padding(.top, 4)

                Spacer(minLength: 10)
            }
            .padding(.horizontal, 24)
        }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                if !isCreatingVault {
                    triggerBiometrics()
                }
            }
        }
        .alert("Подсказка по доступу", isPresented: $showForgotHelp) {
            Button("Понятно", role: .cancel) {}
        } message: {
            Text("• Базовый PIN для демо-базы: 1234.\n• Если ваш PIN состоит из 6 цифр, переключите режим на «6 цифр» вверху.\n• Если вы забыли пароль, нажмите «Сбросить сейф», чтобы очистить хранилище и задать новый PIN.")
        }
        .alert("Сбросить хранилище?", isPresented: $showResetConfirm) {
            Button("Отмена", role: .cancel) {}
            Button("Удалить и начать заново", role: .destructive) {
                vaultService.resetVault()
                isCreatingVault = true
                enteredPin = ""
                errorMessage = nil
            }
        } message: {
            Text("Все локальные записи на этом устройстве будут удалены, и вы сможете задать новый PIN без старого пароля.")
        }
    }

    private func modePill(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(
                    ZStack {
                        if isSelected {
                            LinearGradient(
                                colors: [Color.white, Color(red: 0.92, green: 0.94, blue: 0.98)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        } else {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.ultraThinMaterial)
                        }
                    }
                )
                .foregroundColor(isSelected ? .black : .white.opacity(0.75))
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

    private func keypadButton(_ digit: String, _ letters: String) -> some View {
        LiquidGlassKeypadButton(digit: digit, letters: letters) {
            appendDigit(digit)
        }
    }

    private func appendDigit(_ d: String) {
        guard enteredPin.count < pinLength else { return }
        errorMessage = nil
        enteredPin += d

        if enteredPin.count == pinLength {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                if !isCreatingVault {
                    attemptUnlock(force: false)
                } else {
                    createVaultWithPin()
                }
            }
        }
    }

    private func deleteDigit() {
        if !enteredPin.isEmpty {
            #if canImport(UIKit)
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            #endif
            enteredPin.removeLast()
            errorMessage = nil
        }
    }

    private func attemptUnlock(force: Bool) {
        guard !isAuthenticating else { return }
        isAuthenticating = true

        let success = vaultService.tryUnlock(password: enteredPin)
        isAuthenticating = false

        if !success {
            #if canImport(UIKit)
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.error)
            #endif
            isShaking = true
            errorMessage = "Неверный PIN (\(enteredPin.count) цифр). Попробуйте снова"
            enteredPin = ""
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                isShaking = false
            }
        } else {
            #if canImport(UIKit)
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
            #endif
        }
    }

    private func createVaultWithPin() {
        guard enteredPin.count >= 4 else {
            errorMessage = "PIN должен содержать минимум 4 цифры"
            return
        }
        do {
            try vaultService.initialize(password: enteredPin)
            #if canImport(UIKit)
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
            #endif
            isCreatingVault = false
        } catch {
            errorMessage = error.localizedDescription
            enteredPin = ""
        }
    }

    private func triggerBiometrics() {
        guard BiometricsService.shared.biometricType != .none else { return }
        Task {
            let result = await BiometricsService.shared.authenticate()
            await MainActor.run {
                switch result {
                case .success(let success):
                    if success {
                        // 1. Try saved token first
                        if let token = vaultService.getSavedMasterToken(), !token.isEmpty {
                            if vaultService.tryUnlock(password: token) {
                                #if canImport(UIKit)
                                let notify = UINotificationFeedbackGenerator()
                                notify.notificationOccurred(.success)
                                #endif
                                return
                            }
                        }

                        // 2. Try default demo PIN "1234"
                        if vaultService.tryUnlock(password: "1234") {
                            #if canImport(UIKit)
                            let notify = UINotificationFeedbackGenerator()
                            notify.notificationOccurred(.success)
                            #endif
                            return
                        }

                        errorMessage = "Введите PIN вручную один раз, чтобы привязать Face ID"
                    }
                case .failure(let err):
                    errorMessage = err.localizedDescription
                }
            }
        }
    }
}
