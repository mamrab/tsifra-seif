import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

public struct LiquidGlassBackground: View {
    @State private var animateGradients = false

    public init() {}

    public var body: some View {
        ZStack {
            // Deep base background
            Color(red: 0.03, green: 0.04, blue: 0.07)
                .ignoresSafeArea()

            // Glowing liquid orbs
            GeometryReader { proxy in
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [Color.emeraldAccent.opacity(0.35), Color.clear],
                                center: .center,
                                startRadius: 10,
                                endRadius: proxy.size.width * 0.6
                            )
                        )
                        .frame(width: proxy.size.width * 0.9, height: proxy.size.width * 0.9)
                        .offset(x: animateGradients ? -50 : 30, y: animateGradients ? -60 : 40)
                        .blur(radius: 50)

                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [Color.cyanAccent.opacity(0.25), Color.clear],
                                center: .center,
                                startRadius: 10,
                                endRadius: proxy.size.width * 0.55
                            )
                        )
                        .frame(width: proxy.size.width * 0.8, height: proxy.size.width * 0.8)
                        .offset(x: animateGradients ? 60 : -40, y: animateGradients ? 150 : 80)
                        .blur(radius: 60)

                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [Color.purpleAccent.opacity(0.18), Color.clear],
                                center: .center,
                                startRadius: 10,
                                endRadius: proxy.size.width * 0.5
                            )
                        )
                        .frame(width: proxy.size.width * 0.7, height: proxy.size.width * 0.7)
                        .offset(x: animateGradients ? -30 : 50, y: animateGradients ? 300 : 250)
                        .blur(radius: 50)
                }
            }
            .ignoresSafeArea()
            .onAppear {
                withAnimation(.easeInOut(duration: 8.0).repeatForever(autoreverses: true)) {
                    animateGradients.toggle()
                }
            }

            // Translucent glass dust overlay
            Rectangle()
                .fill(.ultraThinMaterial.opacity(0.4))
                .ignoresSafeArea()
        }
    }
}

public struct LiquidGlassCardModifier: ViewModifier {
    var cornerRadius: CGFloat = 22

    public func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.25),
                                        Color.white.opacity(0.05),
                                        Color.emeraldAccent.opacity(0.2)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1.2
                            )
                    )
                    .shadow(color: Color.black.opacity(0.4), radius: 20, x: 0, y: 10)
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
            .background(
                LinearGradient(
                    colors: [Color.emeraldAccent, Color(red: 0.1, green: 0.85, blue: 0.7)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(color: Color.emeraldAccent.opacity(0.35), radius: 15, x: 0, y: 6)
        }
    }
}

extension View {
    public func liquidGlassCard(cornerRadius: CGFloat = 22) -> some View {
        modifier(LiquidGlassCardModifier(cornerRadius: cornerRadius))
    }
}

extension Color {
    public static let emeraldAccent = Color(red: 0.15, green: 0.85, blue: 0.55)
    public static let cyanAccent = Color(red: 0.1, green: 0.75, blue: 0.95)
    public static let purpleAccent = Color(red: 0.6, green: 0.35, blue: 0.95)
}
