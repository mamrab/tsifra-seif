import SwiftUI

@main
public struct TsifraSafeApp: App {
    @StateObject private var vaultService = CryptoVaultService.shared
    @Environment(\.scenePhase) private var scenePhase

    public init() {}

    public var body: some Scene {
        WindowGroup {
            Group {
                if vaultService.isUnlocked {
                    DashboardView(vaultService: vaultService)
                } else {
                    LockView(vaultService: vaultService)
                }
            }
            .preferredColorScheme(.dark)
            .onChange(of: scenePhase) { newPhase in
                if newPhase == .background && vaultService.vaultData.settings.lockOnBackground {
                    vaultService.lock()
                }
            }
        }
    }
}
