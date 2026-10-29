import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

// =========================================================================
// Apple iOS 27 Liquid Glass Foundation
// =========================================================================

public struct LiquidGlassBackground: View {
    public init() {}

    public var body: some View {
        ZStack {
            // 1. Deep Obsidian Space Canvas
            Color(red: 0.03, green: 0.035, blue: 0.05)
                .ignoresSafeArea()

            // 2. Dynamic Refractive Aurora Blobs (Luminous Bioluminescence)
            GeometryReader { proxy in
                let w = proxy.size.width
                let h = proxy.size.height

                ZStack {
                    // Top-Left Cyan/Sky Luminescence
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.15, green: 0.78, blue: 0.98).opacity(0.35),
                                    Color(red: 0.02, green: 0.45, blue: 0.72).opacity(0.12),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 0,
                                endRadius: w * 0.5
                            )
                        )
                        .frame(width: w * 1.1, height: w * 1.1)
                        .offset(x: -w * 0.25, y: -h * 0.12)
                        .blur(radius: 40)

                    // Center-Right Electric Ultraviolet Glow
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.48, green: 0.32, blue: 0.98).opacity(0.28),
                                    Color(red: 0.25, green: 0.15, blue: 0.85).opacity(0.10),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 0,
                                endRadius: w * 0.45
                            )
                        )
                        .frame(width: w * 0.95, height: w * 0.95)
                        .offset(x: w * 0.25, y: h * 0.25)
                        .blur(radius: 50)

                    // Bottom-Center Emerald Vault Core
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.12, green: 0.84, blue: 0.62).opacity(0.22),
                                    Color(red: 0.03, green: 0.45, blue: 0.35).opacity(0.08),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 0,
                                endRadius: w * 0.4
                            )
                        )
                        .frame(width: w * 0.85, height: w * 0.85)
                        .offset(x: -w * 0.1, y: h * 0.65)
                        .blur(radius: 45)
                }
            }
            .ignoresSafeArea()

            // 3. Ultra-subtle chromatic grain vignette
            LinearGradient(
                colors: [
                    Color.black.opacity(0.25),
                    Color.clear,
                    Color.black.opacity(0.55)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
        }
    }
}

// =========================================================================
// Real Apple Liquid Glass Card Modifier
// =========================================================================

public struct LiquidGlassCardModifier: ViewModifier {
    var cornerRadius: CGFloat = 22

    public func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    // Layer 1: Apple Hardware Blur (Real Frosted Glass)
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(.ultraThinMaterial)

                    // Layer 2: Translucent Tint (Obsidian Glass Depth)
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.08),
                                    Color(red: 0.06, green: 0.07, blue: 0.11).opacity(0.45)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )

                    // Layer 3: Top Refractive Specular Highlight (Simulating Glass Bevel)
                    VStack {
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.35),
                                Color.white.opacity(0.0)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 1.5)
                        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
                        Spacer()
                    }
                    .padding(.horizontal, 2)
                    .padding(.top, 1)

                    // Layer 4: Razor-Sharp Specular Glass Rim
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.50),
                                    Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.30),
                                    Color.white.opacity(0.06),
                                    Color.white.opacity(0.22)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1.0
                        )
                }
                .shadow(color: Color.black.opacity(0.40), radius: 18, x: 0, y: 8)
                .shadow(color: Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.05), radius: 12, x: 0, y: 2)
            )
    }
}

// =========================================================================
// Liquid Glass Input Box Modifier
// =========================================================================

public struct LiquidGlassInputModifier: ViewModifier {
    var cornerRadius: CGFloat = 14

    public func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(.ultraThinMaterial)

                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(Color(white: 0.05).opacity(0.35))

                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.32),
                                    Color.white.opacity(0.08)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1.0
                        )
                }
            )
    }
}

// =========================================================================
// Liquid Glass Circular Keypad Button (iPhone Lock Screen Glass Disc)
// =========================================================================

public struct LiquidGlassKeypadButton: View {
    public let digit: String
    public let letters: String?
    public let action: () -> Void

    public init(digit: String, letters: String? = nil, action: @escaping () -> Void) {
        self.digit = digit
        self.letters = letters
        self.action = action
    }

    public var body: some View {
        Button(action: {
            #if canImport(UIKit)
            let impact = UIImpactFeedbackGenerator(style: .rigid)
            impact.impactOccurred()
            #endif
            action()
        }) {
            ZStack {
                // Glass Base with Apple Ultra-Thin Blur
                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 72, height: 72)

                // Translucent Liquid Glass Surface
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.16),
                                Color(red: 0.10, green: 0.12, blue: 0.18).opacity(0.35)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 72, height: 72)

                // Top Crescent Specular Reflection
                VStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color.white.opacity(0.35), Color.clear],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .frame(width: 60, height: 24)
                        .blur(radius: 2)
                    Spacer()
                }
                .frame(width: 72, height: 72)
                .clipShape(Circle())

                // Specular Glass Rim
                Circle()
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.55),
                                Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.30),
                                Color.white.opacity(0.12)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1.2
                    )
                    .frame(width: 72, height: 72)

                // Text / Subtext
                VStack(spacing: 0) {
                    Text(digit)
                        .font(.system(size: 30, weight: .regular, design: .rounded))
                        .foregroundColor(.white)

                    if let l = letters, !l.isEmpty {
                        Text(l)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white.opacity(0.55))
                            .tracking(1.5)
                    }
                }
            }
            .shadow(color: Color.black.opacity(0.35), radius: 10, x: 0, y: 5)
        }
    }
}

// =========================================================================
// Liquid Glass Circular Icon Button
// =========================================================================

public struct LiquidGlassIconButton: View {
    public let icon: String
    public let color: Color
    public let size: CGFloat
    public let action: () -> Void

    public init(icon: String, color: Color = .white, size: CGFloat = 40, action: @escaping () -> Void) {
        self.icon = icon
        self.color = color
        self.size = size
        self.action = action
    }

    public var body: some View {
        Button(action: {
            #if canImport(UIKit)
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            #endif
            action()
        }) {
            ZStack {
                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: size, height: size)

                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: size, height: size)

                Circle()
                    .stroke(
                        LinearGradient(
                            colors: [Color.white.opacity(0.40), Color.white.opacity(0.10)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1.0
                    )
                    .frame(width: size, height: size)

                Image(systemName: icon)
                    .font(.system(size: size * 0.42, weight: .semibold))
                    .foregroundColor(color)
            }
            .shadow(color: Color.black.opacity(0.25), radius: 6, x: 0, y: 3)
        }
    }
}

// =========================================================================
// Liquid Glass Primary Button (Apple Pearl Glass Button)
// =========================================================================

public struct LiquidGlassButton: View {
    public let title: String
    public let systemIcon: String?
    public let action: () -> Void

    public init(title: String, systemIcon: String? = nil, action: @escaping () -> Void) {
        self.title = title
        self.systemIcon = systemIcon
        self.action = action
    }

    public var body: some View {
        Button(action: {
            #if canImport(UIKit)
            let impact = UIImpactFeedbackGenerator(style: .medium)
            impact.impactOccurred()
            #endif
            action()
        }) {
            HStack(spacing: 8) {
                if let icon = systemIcon {
                    Image(systemName: icon)
                        .font(.system(size: 15, weight: .bold))
                }
                Text(title)
                    .font(.system(size: 15, weight: .bold))
            }
            .foregroundColor(.black)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                ZStack {
                    // Liquid Pearl Gradient
                    LinearGradient(
                        colors: [
                            Color.white,
                            Color(red: 0.94, green: 0.96, blue: 0.99)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )

                    // Top Edge Gleam
                    VStack {
                        LinearGradient(
                            colors: [Color.white, Color.white.opacity(0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 2)
                        Spacer()
                    }

                    // Delicate Pearl Glass Rim
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(Color.white.opacity(0.8), lineWidth: 1.0)
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .shadow(color: Color.white.opacity(0.25), radius: 14, x: 0, y: 5)
            .shadow(color: Color.black.opacity(0.25), radius: 8, x: 0, y: 4)
        }
    }
}

// =========================================================================
// View Extensions
// =========================================================================

extension View {
    public func liquidGlassCard(cornerRadius: CGFloat = 22) -> some View {
        modifier(LiquidGlassCardModifier(cornerRadius: cornerRadius))
    }

    public func liquidGlassInput(cornerRadius: CGFloat = 14) -> some View {
        modifier(LiquidGlassInputModifier(cornerRadius: cornerRadius))
    }
}

// iOS Accent Color Palette
extension Color {
    public static let emeraldAccent = Color(red: 0.15, green: 0.85, blue: 0.65)
    public static let cyanAccent = Color(red: 0.22, green: 0.74, blue: 0.97)
    public static let purpleAccent = Color(red: 0.51, green: 0.45, blue: 0.98)
    public static let amberAccent = Color(red: 0.98, green: 0.75, blue: 0.18)
    public static let monoBorder = Color.white.opacity(0.18)
    public static let monoSurface = Color(red: 0.07, green: 0.08, blue: 0.12)
}
