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
        // First check if biometrics or passcode is available
        let canEvaluateBiometrics = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        let policy: LAPolicy = canEvaluateBiometrics ? .deviceOwnerAuthenticationWithBiometrics : .deviceOwnerAuthentication

        guard context.canEvaluatePolicy(policy, error: &error) else {
            let msg = error?.localizedDescription ?? "Биометрия недоступна на этом устройстве"
            return .failure(NSError(domain: "Biometrics", code: -1, userInfo: [NSLocalizedDescriptionKey: msg]))
        }

        do {
            let success = try await context.evaluatePolicy(policy, localizedReason: reason)
            return .success(success)
        } catch let laError as LAError {
            let friendlyMessage: String
            switch laError.code {
            case .userCancel, .appCancel:
                friendlyMessage = "Вход отменен"
            case .authenticationFailed:
                friendlyMessage = "Face ID не распознан. Попробуйте снова или введите PIN"
            case .biometryNotEnrolled:
                friendlyMessage = "Face ID не настроен в настройках iPhone"
            case .biometryLockout:
                friendlyMessage = "Слишком много попыток Face ID. Введите код-пароль устройства"
            case .passcodeNotSet:
                friendlyMessage = "На iPhone не задан код-пароль"
            default:
                friendlyMessage = laError.localizedDescription
            }
            return .failure(NSError(domain: "Biometrics", code: laError.errorCode, userInfo: [NSLocalizedDescriptionKey: friendlyMessage]))
        } catch {
            return .failure(error)
        }
    }
}
