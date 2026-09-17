import Foundation

public struct GeneratedPassword {
    public let value: String
    public let entropy: Double
    public let strengthLabel: String
    public let score: Int
}

public final class PasswordGenerator {
    private static let uppercaseChars = Array("ABCDEFGHJKLMNPQRSTUVWXYZ")
    private static let lowercaseChars = Array("abcdefghijkmnopqrstuvwxyz")
    private static let digitChars = Array("23456789")
    private static let symbolChars = Array("!@#$%^&*()-_=+[]{}|;:,.<>?")

    private static let words = [
        "anchor", "beacon", "citadel", "delta", "ember", "falcon", "glacier", "harbor", "island",
        "jungle", "karma", "lagoon", "matrix", "nexus", "orbit", "phoenix", "quantum", "radar",
        "shadow", "timber", "ultra", "vortex", "whisper", "zenith", "crystal", "shield", "cipher",
        "aurora", "comet", "nebula", "pulsar", "quasar", "stellar", "titan", "voyage", "zen",
        "cascade", "dune", "echo", "frost", "granite", "horizon", "infinity", "keystone", "lunar"
    ]

    public static func generatePassword(
        length: Int = 18,
        includeUppercase: Bool = true,
        includeLowercase: Bool = true,
        includeDigits: Bool = true,
        includeSymbols: Bool = true
    ) -> GeneratedPassword {
        var pool: [Character] = []
        var required: [Character] = []

        if includeLowercase {
            pool.append(contentsOf: lowercaseChars)
            if let ch = lowercaseChars.randomElement() { required.append(ch) }
        }
        if includeUppercase {
            pool.append(contentsOf: uppercaseChars)
            if let ch = uppercaseChars.randomElement() { required.append(ch) }
        }
        if includeDigits {
            pool.append(contentsOf: digitChars)
            if let ch = digitChars.randomElement() { required.append(ch) }
        }
        if includeSymbols {
            pool.append(contentsOf: symbolChars)
            if let ch = symbolChars.randomElement() { required.append(ch) }
        }

        if pool.isEmpty {
            pool.append(contentsOf: lowercaseChars + digitChars)
        }

        let remaining = max(0, length - required.count)
        var result = required
        for _ in 0..<remaining {
            if let ch = pool.randomElement() {
                result.append(ch)
            }
        }
        result.shuffle()

        let passwordString = String(result)
        let entropy = Double(length) * log2(Double(pool.count))
        let (score, label) = evaluateStrength(entropy: entropy)

        return GeneratedPassword(
            value: passwordString,
            entropy: (entropy * 10).rounded() / 10,
            strengthLabel: label,
            score: score
        )
    }

    public static func generatePassphrase(wordCount: Int = 4, separator: String = "-") -> GeneratedPassword {
        var chosen: [String] = []
        for _ in 0..<wordCount {
            if let w = words.randomElement() {
                chosen.append(w)
            }
        }
        let phrase = chosen.joined(separator: separator)
        let entropy = Double(wordCount) * log2(Double(words.count))
        let (score, label) = evaluateStrength(entropy: entropy)

        return GeneratedPassword(
            value: phrase,
            entropy: (entropy * 10).rounded() / 10,
            strengthLabel: label,
            score: score
        )
    }

    public static func generatePin(length: Int = 6) -> GeneratedPassword {
        let digits = Array("0123456789")
        var res = ""
        for _ in 0..<length {
            if let d = digits.randomElement() {
                res.append(d)
            }
        }
        let entropy = Double(length) * log2(10.0)
        let (score, label) = evaluateStrength(entropy: entropy)

        return GeneratedPassword(
            value: res,
            entropy: (entropy * 10).rounded() / 10,
            strengthLabel: label,
            score: score
        )
    }

    private static func evaluateStrength(entropy: Double) -> (Int, String) {
        if entropy < 30 { return (0, "Слабый") }
        if entropy < 50 { return (1, "Средний") }
        if entropy < 70 { return (2, "Хороший") }
        if entropy < 90 { return (3, "Стойкий") }
        return (4, "Максимальная защита")
    }
}
