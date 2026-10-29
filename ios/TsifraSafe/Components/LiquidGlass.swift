import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct LiquidGlassBackground: View {
    public init() {}

    public var body: some View {
        ZStack {
            // Obsidian deep canvas
            Color(red: 0.02, green: 0.02, blue: 0.03)
                .ignoresSafeArea()

            // Dynamic Ambient Aurora Orbs (iOS 27 Flagship Aesthetic)
            GeometryReader { proxy in
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.18),
                                    Color(red: 0.01, green: 0.41, blue: 0.63).opacity(0.06),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 0,
                                endRadius: proxy.size.width * 0.45
                            )
                        )
                        .frame(width: proxy.size.width * 0.9, height: proxy.size.width * 0.9)
                        .offset(x: -30, y: -40)
                        .blur(radius: 50)

                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.51, green: 0.55, blue: 0.97).opacity(0.15),
                                    Color(red: 0.31, green: 0.27, blue: 0.90).opacity(0.05),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 0,
                                endRadius: proxy.size.width * 0.4
                            )
                        )
                        .frame(width: proxy.size.width * 0.8, height: proxy.size.width * 0.8)
                        .offset(x: 60, y: proxy.size.height * 0.35)
                        .blur(radius: 60)
                }
            }
            .ignoresSafeArea()

            // Ultra-thin liquid material overlay
            Rectangle()
                .fill(.ultraThinMaterial.opacity(0.45))
                .ignoresSafeArea()
        }
    }
}

public struct LiquidGlassCardModifier: ViewModifier {
    var cornerRadius: CGFloat = 24

    public func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Color(red: 0.07, green: 0.08, blue: 0.11).opacity(0.75))
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.22),
                                        Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.2),
                                        Color.white.opacity(0.08)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1.2
                            )
                    )
                    .shadow(color: Color.black.opacity(0.6), radius: 20, x: 0, y: 8)
            )
    }
}

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
                LinearGradient(
                    colors: [Color.white, Color(red: 0.92, green: 0.94, blue: 0.97)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .shadow(color: Color.white.opacity(0.18), radius: 12, x: 0, y: 4)
        }
    }
}

extension View {
    public func liquidGlassCard(cornerRadius: CGFloat = 24) -> some View {
        modifier(LiquidGlassCardModifier(cornerRadius: cornerRadius))
    }
}

// iOS 27 Accent tokens
extension Color {
    public static let emeraldAccent = Color(red: 0.20, green: 0.83, blue: 0.60)
    public static let cyanAccent = Color(red: 0.22, green: 0.74, blue: 0.97)
    public static let purpleAccent = Color(red: 0.51, green: 0.55, blue: 0.97)
    public static let monoBorder = Color.white.opacity(0.14)
    public static let monoSurface = Color(red: 0.07, green: 0.08, blue: 0.11)
}
