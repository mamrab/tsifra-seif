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
                Spacer(minLength: 12)

                // Monochrome Shield Logo
                VStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .fill(Color(white: 0.08))
                            .frame(width: 76, height: 76)
                            .overlay(
                                RoundedRectangle(cornerRadius: 24, style: .continuous)
                                    .stroke(Color.white.opacity(0.15), lineWidth: 1)
                            )
                            .shadow(color: Color.black.opacity(0.6), radius: 20, x: 0, y: 8)

                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 36, weight: .semibold))
                            .foregroundColor(.white)
                    }

                    Text("Цифра-Сейф")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    Text(isCreatingVault
                         ? "Задайте новый мастер-PIN (\(pinLength) цифр)"
                         : "Безопасное Zero-Knowledge хранилище")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
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
                    .background(Color(white: 0.15))
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(Color.white.opacity(0.2), lineWidth: 1))
                    .transition(.opacity)
                }

                // PIN Length & Mode Selector
                HStack(spacing: 8) {
                    Button(action: {
                        pinLength = 4
                        enteredPin = ""
                        errorMessage = nil
                        useTextPassword = false
                    }) {
                        Text("4 цифры")
                            .font(.system(size: 11, weight: .semibold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(pinLength == 4 && !useTextPassword ? Color.white : Color(white: 0.1))
                            .foregroundColor(pinLength == 4 && !useTextPassword ? .black : .white.opacity(0.6))
                            .clipShape(Capsule())
                    }

                    Button(action: {
                        pinLength = 6
                        enteredPin = ""
                        errorMessage = nil
                        useTextPassword = false
                    }) {
                        Text("6 цифр")
                            .font(.system(size: 11, weight: .semibold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(pinLength == 6 && !useTextPassword ? Color.white : Color(white: 0.1))
                            .foregroundColor(pinLength == 6 && !useTextPassword ? .black : .white.opacity(0.6))
                            .clipShape(Capsule())
                    }

                    Button(action: {
                        useTextPassword.toggle()
                        enteredPin = ""
                        errorMessage = nil
                    }) {
                        Text(useTextPassword ? "PIN-код" : "Пароль")
                            .font(.system(size: 11, weight: .semibold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(useTextPassword ? Color.white : Color(white: 0.1))
                            .foregroundColor(useTextPassword ? .black : .white.opacity(0.6))
                            .clipShape(Capsule())
                    }
                }

                if !useTextPassword {
                    // PIN Bullets
                    HStack(spacing: 14) {
                        ForEach(0..<pinLength, id: \.self) { idx in
                            Circle()
                                .fill(idx < enteredPin.count ? Color.white : Color.white.opacity(0.12))
                                .frame(width: 14, height: 14)
                                .overlay(
                                    Circle()
                                        .stroke(Color.white.opacity(0.25), lineWidth: 1)
                                )
                                .scaleEffect(idx < enteredPin.count ? 1.15 : 1.0)
                                .animation(.spring(response: 0.2, dampingFraction: 0.7), value: enteredPin.count)
                        }
                    }
                    .padding(.vertical, 2)
                    .offset(x: isShaking ? -10 : 0)
                    .animation(.default.repeatCount(3, autoreverses: true).speed(4), value: isShaking)

                    // Numeric Pad
                    VStack(spacing: 12) {
                        ForEach(0..<3) { row in
                            HStack(spacing: 18) {
                                ForEach(1..<4) { col in
                                    let num = row * 3 + col
                                    pinButton("\(num)")
                                }
                            }
                        }

                        HStack(spacing: 18) {
                            // Left action: Face ID or Reset Pad
                            if !isCreatingVault {
                                Button(action: triggerBiometrics) {
                                    ZStack {
                                        Circle()
                                            .fill(Color(white: 0.1))
                                            .frame(width: 70, height: 70)
                                            .overlay(Circle().stroke(Color.white.opacity(0.15), lineWidth: 1))
                                        Image(systemName: BiometricsService.shared.biometricType.systemIcon)
                                            .font(.system(size: 26, weight: .medium))
                                            .foregroundColor(.white)
                                    }
                                }
                            } else {
                                Button(action: { enteredPin = ""; errorMessage = nil }) {
                                    ZStack {
                                        Circle()
                                            .fill(Color(white: 0.08))
                                            .frame(width: 70, height: 70)
                                        Text("Сброс")
                                            .font(.system(size: 13, weight: .medium))
                                            .foregroundColor(.white.opacity(0.6))
                                    }
                                }
                            }

                            pinButton("0")

                            // Right action: Backspace
                            Button(action: deleteDigit) {
                                ZStack {
                                    Circle()
                                        .fill(Color(white: 0.08))
                                        .frame(width: 70, height: 70)
                                        .overlay(Circle().stroke(Color.white.opacity(0.1), lineWidth: 1))
                                    Image(systemName: "delete.left.fill")
                                        .font(.system(size: 20, weight: .medium))
                                        .foregroundColor(.white.opacity(0.85))
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
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(Color.white)
                                .clipShape(Capsule())
                        }
                        .transition(.opacity)
                    }
                } else {
                    // Full text password input mode
                    VStack(spacing: 14) {
                        SecureField("Введите мастер-пароль...", text: $enteredPin)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 14)
                            .background(Color(white: 0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
                            )
                            .foregroundColor(.white)
                            .font(.system(size: 16, design: .monospaced))

                        Button(action: {
                            if !isCreatingVault {
                                attemptUnlock(force: true)
                            } else {
                                createVaultWithPin()
                            }
                        }) {
                            Text(isCreatingVault ? "Создать сейф" : "Разблокировать")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
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
                        .foregroundColor(.white.opacity(0.5))
                    }

                    Text("•").foregroundColor(.white.opacity(0.2))

                    Button(action: { showResetConfirm = true }) {
                        Text("Сбросить сейф")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
                .padding(.top, 4)

                Spacer(minLength: 12)
            }
            .padding(.horizontal, 24)
        }
        .onAppear {
            // Auto-trigger biometrics if available
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

    private func pinButton(_ digit: String) -> some View {
        Button(action: { appendDigit(digit) }) {
            ZStack {
                Circle()
                    .fill(Color(white: 0.08))
                    .frame(width: 70, height: 70)
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )
                    .shadow(color: Color.black.opacity(0.4), radius: 8, x: 0, y: 4)

                Text(digit)
                    .font(.system(size: 26, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
            }
        }
    }

    private func appendDigit(_ digit: String) {
        #if canImport(UIKit)
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()
        #endif

        guard enteredPin.count < pinLength else { return }
        enteredPin.append(digit)
        errorMessage = nil

        // Smart unlock check
        if !isCreatingVault {
            // Check if current enteredPin successfully decrypts the vault
            if vaultService.canDecryptWith(password: enteredPin) {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                    attemptUnlock(force: true)
                }
                return
            }

            // If user completed configured pinLength and it still did not match
            if enteredPin.count == pinLength {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                    attemptUnlock(force: true)
                }
            }
        } else {
            // Creation mode
            if enteredPin.count == pinLength {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                    createVaultWithPin()
                }
            }
        }
    }

    private func deleteDigit() {
        #if canImport(UIKit)
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()
        #endif
        guard !enteredPin.isEmpty else { return }
        enteredPin.removeLast()
        errorMessage = nil
    }

    private func attemptUnlock(force: Bool = false) {
        do {
            try vaultService.unlock(password: enteredPin)
            #if canImport(UIKit)
            let notify = UINotificationFeedbackGenerator()
            notify.notificationOccurred(.success)
            #endif
            errorMessage = nil
        } catch {
            #if canImport(UIKit)
            let notify = UINotificationFeedbackGenerator()
            notify.notificationOccurred(.error)
            #endif
            isShaking.toggle()

            if pinLength == 4 {
                errorMessage = "Неверный PIN (\(enteredPin)). Попробуйте 1234, переключите на 6 цифр или сбросьте"
            } else {
                errorMessage = "Неверный PIN (\(enteredPin)). Попробуйте еще раз или сбросьте сейф"
            }

            // Delay clearing so user sees what was typed
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                enteredPin = ""
            }
        }
    }

    private func createVaultWithPin() {
        do {
            try vaultService.initialize(password: enteredPin)
            #if canImport(UIKit)
            let notify = UINotificationFeedbackGenerator()
            notify.notificationOccurred(.success)
            #endif
        } catch {
            errorMessage = error.localizedDescription
            isShaking.toggle()
            enteredPin = ""
        }
    }

    private func triggerBiometrics() {
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

                        // 3. Prompt user to enter PIN once
                        errorMessage = "Введите PIN вручную один раз, чтобы привязать Face ID"
                    }
                case .failure(let err):
                    errorMessage = err.localizedDescription
                }
            }
        }
    }
}
