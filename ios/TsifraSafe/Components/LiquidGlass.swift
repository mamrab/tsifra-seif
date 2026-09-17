import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct LiquidGlassBackground: View {
    public init() {}

    public var body: some View {
        ZStack {
            // Pure deep monochrome black
            Color.black
                .ignoresSafeArea()

            // Subtle monochrome ambient dark shading (zero color gradients)
            GeometryReader { proxy in
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.04))
                        .frame(width: proxy.size.width * 0.9, height: proxy.size.width * 0.9)
                        .offset(x: -30, y: -40)
                        .blur(radius: 60)

                    Circle()
                        .fill(Color.white.opacity(0.03))
                        .frame(width: proxy.size.width * 0.8, height: proxy.size.width * 0.8)
                        .offset(x: 50, y: 180)
                        .blur(radius: 70)
                }
            }
            .ignoresSafeArea()

            // Ultra-thin dark glass blur overlay
            Rectangle()
                .fill(.ultraThinMaterial.opacity(0.5))
                .ignoresSafeArea()
        }
    }
}

public struct LiquidGlassCardModifier: ViewModifier {
    var cornerRadius: CGFloat = 20

    public func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Color(red: 0.06, green: 0.06, blue: 0.07).opacity(0.85))
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )
                    .shadow(color: Color.black.opacity(0.5), radius: 16, x: 0, y: 6)
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
                        .font(.system(size: 15, weight: .semibold))
                }
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
            }
            .foregroundColor(.black)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .shadow(color: Color.white.opacity(0.1), radius: 10, x: 0, y: 4)
        }
    }
}

extension View {
    public func liquidGlassCard(cornerRadius: CGFloat = 20) -> some View {
        modifier(LiquidGlassCardModifier(cornerRadius: cornerRadius))
    }
}

// Monochrome accent tokens
extension Color {
    public static let emeraldAccent = Color.white
    public static let cyanAccent = Color.white.opacity(0.85)
    public static let purpleAccent = Color.white.opacity(0.7)
    public static let monoBorder = Color.white.opacity(0.12)
    public static let monoSurface = Color(red: 0.08, green: 0.08, blue: 0.09)
}
