import Foundation
import LocalAuthentication

public final class BiometricsService {
    public static let shared = BiometricsService()

    public enum BiometricType {
        case none
        case touchID
        case faceID
        case opticID

        public var title: String {
            switch self {
            case .faceID: return "Face ID"
            case .touchID: return "Touch ID"
            case .opticID: return "Optic ID"
            case .none: return "Биометрия"
            }
        }

        public var systemIcon: String {
            switch self {
            case .faceID: return "faceid"
            case .touchID: return "touchid"
            case .opticID: return "opticid"
            case .none: return "lock.shield"
            }
        }
    }

    public var biometricType: BiometricType {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .none
        }

        switch context.biometryType {
        case .faceID: return .faceID
        case .touchID: return .touchID
        case .opticID: return .opticID
        case .none: return .none
        @unknown default: return .none
        }
    }

    public func authenticate(reason: String = "Разблокируйте Цифра-Сейф для доступа к паролям") async -> Result<Bool, Error> {
        let context = LAContext()
        context.localizedCancelTitle = "Отмена"

        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .failure(error ?? NSError(domain: "Biometrics", code: -1, userInfo: [NSLocalizedDescriptionKey: "Биометрия недоступна"]))
        }

        do {
            let success = try await context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason)
            return .success(success)
        } catch {
            return .failure(error)
        }
    }
}
