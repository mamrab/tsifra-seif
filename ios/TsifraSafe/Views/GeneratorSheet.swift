import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct GeneratorSheet: View {
    @Environment(\.dismiss) private var dismiss
    public var onSelect: ((String) -> Void)?

    @State private var mode: Int = 0 // 0: Password, 1: Passphrase, 2: PIN
    @State private var length: Double = 18
    @State private var wordCount: Double = 4
    @State private var pinLength: Double = 6

    @State private var includeUpper: Bool = true
    @State private var includeLower: Bool = true
    @State private var includeDigits: Bool = true
    @State private var includeSymbols: Bool = true

    @State private var generated: GeneratedPassword?
    @State private var isCopied: Bool = false

    public init(onSelect: ((String) -> Void)? = nil) {
        self.onSelect = onSelect
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackground()

                VStack(spacing: 20) {
                    // Mode Picker
                    Picker("Режим", selection: $mode) {
                        Text("Пароль").tag(0)
                        Text("Фраза").tag(1)
                        Text("PIN").tag(2)
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: mode) { regenerate() }

                    // Display Box with Entropy
                    VStack(spacing: 12) {
                        Text(generated?.value ?? "...")
                            .font(.system(size: 18, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)
                            .lineLimit(3)
                            .padding(.horizontal, 10)

                        HStack {
                            Text(generated?.strengthLabel ?? "")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.white.opacity(0.8))

                            Spacer()

                            Text("\(Int(generated?.entropy ?? 0)) бит энтропии")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(.white.opacity(0.5))
                        }
                    }
                    .padding(18)
                    .liquidGlassCard(cornerRadius: 20)

                    // Controls based on Mode
                    VStack(spacing: 16) {
                        if mode == 0 {
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text("Длина: \(Int(length)) символов")
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(.white)
                                    Spacer()
                                }
                                Slider(value: $length, in: 8...48, step: 1)
                                    .tint(.white)
                                    .onChange(of: length) { regenerate() }
                            }

                            Divider().background(Color.white.opacity(0.1))

                            Toggle("Заглавные (A-Z)", isOn: $includeUpper)
                                .tint(.white)
                                .onChange(of: includeUpper) { regenerate() }

                            Toggle("Строчные (a-z)", isOn: $includeLower)
                                .tint(.white)
                                .onChange(of: includeLower) { regenerate() }

                            Toggle("Цифры (0-9)", isOn: $includeDigits)
                                .tint(.white)
                                .onChange(of: includeDigits) { regenerate() }

                            Toggle("Спецсимволы (!@#$)", isOn: $includeSymbols)
                                .tint(.white)
                                .onChange(of: includeSymbols) { regenerate() }
                        } else if mode == 1 {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Количество слов: \(Int(wordCount))")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.white)
                                Slider(value: $wordCount, in: 3...8, step: 1)
                                    .tint(.white)
                                    .onChange(of: wordCount) { regenerate() }
                            }
                        } else {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Длина PIN: \(Int(pinLength)) цифр")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.white)
                                Slider(value: $pinLength, in: 4...12, step: 1)
                                    .tint(.white)
                                    .onChange(of: pinLength) { regenerate() }
                            }
                        }
                    }
                    .foregroundColor(.white)
                    .padding(16)
                    .liquidGlassCard(cornerRadius: 20)

                    Spacer()

                    // Action Buttons
                    VStack(spacing: 10) {
                        if let onSelect = onSelect {
                            Button(action: {
                                if let val = generated?.value {
                                    onSelect(val)
                                    dismiss()
                                }
                            }) {
                                HStack(spacing: 8) {
                                    Image(systemName: "checkmark.shield.fill")
                                    Text("Использовать этот пароль")
                                }
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            }
                        }

                        Button(action: copyToClipboard) {
                            HStack(spacing: 8) {
                                Image(systemName: isCopied ? "checkmark" : "doc.on.doc.fill")
                                Text(isCopied ? "Скопировано в буфер" : "Скопировать пароль")
                            }
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(onSelect == nil ? .black : .white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(onSelect == nil ? Color.white : Color(white: 0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                    }
                }
                .padding(20)
            }
            .navigationTitle("Генератор")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Закрыть") { dismiss() }
                        .foregroundColor(.white.opacity(0.8))
                }
                ToolbarItem(placement: .primaryAction) {
                    Button(action: regenerate) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.white)
                    }
                }
            }
            .onAppear {
                regenerate()
            }
        }
    }

    private func regenerate() {
        #if canImport(UIKit)
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()
        #endif

        switch mode {
        case 0:
            // Ensure at least one character set is selected
            let u = includeUpper, l = includeLower, d = includeDigits, s = includeSymbols
            let safeL = (!u && !l && !d && !s) ? true : l
            generated = PasswordGenerator.shared.generate(
                length: Int(length),
                includeUppercase: u,
                includeLowercase: safeL,
                includeDigits: d,
                includeSymbols: s
            )
        case 1:
            generated = PasswordGenerator.shared.generatePassphrase(wordCount: Int(wordCount))
        case 2:
            generated = PasswordGenerator.shared.generatePin(length: Int(pinLength))
        default:
            break
        }
    }

    private func copyToClipboard() {
        guard let val = generated?.value else { return }
        #if canImport(UIKit)
        UIPasteboard.general.string = val
        let notify = UINotificationFeedbackGenerator()
        notify.notificationOccurred(.success)
        #endif
        isCopied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            isCopied = false
        }
    }
}
