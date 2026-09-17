import SwiftUI

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
                    .onChange(of: mode) { _ in regenerate() }

                    // Display Box with Entropy
                    VStack(spacing: 12) {
                        Text(generated?.value ?? "...")
                            .font(.system(size: 18, weight: .bold, design: .monospaced))
                            .foregroundColor(.emeraldAccent)
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
                                Slider(value: $length, in: 8...40, step: 1)
                                    .tint(.emeraldAccent)
                                    .onChange(of: length) { _ in regenerate() }
                            }

                            Divider().background(Color.white.opacity(0.1))

                            Toggle("Заглавные (A-Z)", isOn: $includeUpper)
                                .tint(.emeraldAccent)
                                .onChange(of: includeUpper) { _ in regenerate() }

                            Toggle("Строчные (a-z)", isOn: $includeLower)
                                .tint(.emeraldAccent)
                                .onChange(of: includeLower) { _ in regenerate() }

                            Toggle("Цифры (0-9)", isOn: $includeDigits)
                                .tint(.emeraldAccent)
                                .onChange(of: includeDigits) { _ in regenerate() }

                            Toggle("Спецсимволы (!@#$)", isOn: $includeSymbols)
                                .tint(.emeraldAccent)
                                .onChange(of: includeSymbols) { _ in regenerate() }
                        } else if mode == 1 {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Количество слов: \(Int(wordCount))")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.white)
                                Slider(value: $wordCount, in: 3...7, step: 1)
                                    .tint(.emeraldAccent)
                                    .onChange(of: wordCount) { _ in regenerate() }
                            }
                        } else {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Длина PIN: \(Int(pinLength))")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.white)
                                Slider(value: $pinLength, in: 4...12, step: 1)
                                    .tint(.emeraldAccent)
                                    .onChange(of: pinLength) { _ in regenerate() }
                            }
                        }
                    }
                    .foregroundColor(.white)
                    .font(.system(size: 14))
                    .padding(18)
                    .liquidGlassCard(cornerRadius: 20)

                    Spacer()

                    // Bottom Action Buttons
                    HStack(spacing: 12) {
                        Button(action: regenerate) {
                            ZStack {
                                Circle()
                                    .fill(.ultraThinMaterial)
                                    .frame(width: 52, height: 52)
                                    .overlay(Circle().stroke(Color.white.opacity(0.15), lineWidth: 1))
                                Image(systemName: "arrow.clockwise")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundColor(.white)
                            }
                        }

                        if let onSelect = onSelect {
                            LiquidGlassButton(title: "Использовать", systemIcon: "checkmark") {
                                if let val = generated?.value {
                                    onSelect(val)
                                    dismiss()
                                }
                            }
                        } else {
                            LiquidGlassButton(title: isCopied ? "Скопировано!" : "Скопировать", systemIcon: isCopied ? "checkmark" : "doc.on.doc") {
                                if let val = generated?.value {
                                    UIPasteboard.general.string = val
                                    isCopied = true
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                                        isCopied = false
                                    }
                                }
                            }
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
            }
            .onAppear {
                regenerate()
            }
        }
    }

    private func regenerate() {
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()

        if mode == 0 {
            generated = PasswordGenerator.generatePassword(
                length: Int(length),
                includeUppercase: includeUpper,
                includeLowercase: includeLower,
                includeDigits: includeDigits,
                includeSymbols: includeSymbols
            )
        } else if mode == 1 {
            generated = PasswordGenerator.generatePassphrase(wordCount: Int(wordCount))
        } else {
            generated = PasswordGenerator.generatePin(length: Int(pinLength))
        }
    }
}
