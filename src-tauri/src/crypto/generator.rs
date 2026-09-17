use rand::seq::SliceRandom;
use serde::{Deserialize, Serialize};

const UPPERCASE_CHARS: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ"; // without ambiguous by default or separate
const UPPERCASE_AMBIGUOUS: &[u8] = b"IO";
const LOWERCASE_CHARS: &[u8] = b"abcdefghijkmnopqrstuvwxyz";
const LOWERCASE_AMBIGUOUS: &[u8] = b"l";
const DIGIT_CHARS: &[u8] = b"23456789";
const DIGIT_AMBIGUOUS: &[u8] = b"01";
const SYMBOL_CHARS: &[u8] = b"!@#$%^&*()-_=+[]{}|;:,.<>?";

const PASSPHRASE_WORDS: &[&str] = &[
    "anchor", "beacon", "citadel", "delta", "ember", "falcon", "glacier", "harbor", "island",
    "jungle", "karma", "lagoon", "matrix", "nexus", "orbit", "phoenix", "quantum", "radar",
    "shadow", "timber", "ultra", "vortex", "whisper", "zenith", "crystal", "shield", "cipher",
    "aurora", "comet", "nebula", "pulsar", "quasar", "stellar", "titan", "voyage", "zen",
    "albatross", "breeze", "cascade", "dune", "echo", "frost", "granite", "horizon", "infinity",
    "journey", "keystone", "lunar", "mirage", "nomad", "oasis", "pinnacle", "quartz", "rift",
    "summit", "tundra", "uranium", "velocity", "wave", "apex", "blizzard", "canyon", "drift",
    "element", "forge", "gravity", "halo", "iron", "jupiter", "kinetic", "lightning", "meteor",
    "neutron", "obsidian", "plasma", "quest", "radiant", "strata", "thunder", "unity", "vector"
];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum GeneratorMode {
    Password,
    Passphrase,
    Pin,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratorConfig {
    pub mode: GeneratorMode,
    pub length: usize,
    pub include_uppercase: bool,
    pub include_lowercase: bool,
    pub include_digits: bool,
    pub include_symbols: bool,
    pub exclude_ambiguous: bool,
    pub word_count: usize,
    pub separator: String,
}

impl Default for GeneratorConfig {
    fn default() -> Self {
        Self {
            mode: GeneratorMode::Password,
            length: 16,
            include_uppercase: true,
            include_lowercase: true,
            include_digits: true,
            include_symbols: true,
            exclude_ambiguous: false,
            word_count: 4,
            separator: "-".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedSecret {
    pub value: String,
    pub entropy: f64,
    pub strength_level: String, // "weak", "fair", "good", "strong", "excellent"
    pub score: u8, // 0 to 4
}

pub fn generate_secret(config: &GeneratorConfig) -> GeneratedSecret {
    let mut rng = rand::thread_rng();

    match config.mode {
        GeneratorMode::Pin => {
            let len = config.length.clamp(4, 16);
            let digits = b"0123456789";
            let val: String = (0..len)
                .map(|_| *digits.choose(&mut rng).unwrap() as char)
                .collect();
            let entropy = (len as f64) * 10f64.log2();
            let (score, level) = calculate_strength(entropy);
            GeneratedSecret {
                value: val,
                entropy: (entropy * 10.0).round() / 10.0,
                strength_level: level,
                score,
            }
        }
        GeneratorMode::Passphrase => {
            let count = config.word_count.clamp(3, 10);
            let chosen_words: Vec<&str> = (0..count)
                .map(|_| *PASSPHRASE_WORDS.choose(&mut rng).unwrap())
                .collect();
            let val = chosen_words.join(&config.separator);
            // Entropy: count * log2(dictionary size)
            let dict_size = PASSPHRASE_WORDS.len() as f64;
            let entropy = (count as f64) * dict_size.log2();
            let (score, level) = calculate_strength(entropy);
            GeneratedSecret {
                value: val,
                entropy: (entropy * 10.0).round() / 10.0,
                strength_level: level,
                score,
            }
        }
        GeneratorMode::Password => {
            let len = config.length.clamp(6, 64);
            let mut pool: Vec<u8> = Vec::new();
            let mut required_chars: Vec<u8> = Vec::new();

            if config.include_lowercase {
                let mut chars = LOWERCASE_CHARS.to_vec();
                if !config.exclude_ambiguous {
                    chars.extend_from_slice(LOWERCASE_AMBIGUOUS);
                }
                required_chars.push(*chars.choose(&mut rng).unwrap());
                pool.extend(chars);
            }

            if config.include_uppercase {
                let mut chars = UPPERCASE_CHARS.to_vec();
                if !config.exclude_ambiguous {
                    chars.extend_from_slice(UPPERCASE_AMBIGUOUS);
                }
                required_chars.push(*chars.choose(&mut rng).unwrap());
                pool.extend(chars);
            }

            if config.include_digits {
                let mut chars = DIGIT_CHARS.to_vec();
                if !config.exclude_ambiguous {
                    chars.extend_from_slice(DIGIT_AMBIGUOUS);
                }
                required_chars.push(*chars.choose(&mut rng).unwrap());
                pool.extend(chars);
            }

            if config.include_symbols {
                required_chars.push(*SYMBOL_CHARS.choose(&mut rng).unwrap());
                pool.extend_from_slice(SYMBOL_CHARS);
            }

            // Fallback if no sets selected
            if pool.is_empty() {
                pool.extend_from_slice(LOWERCASE_CHARS);
                pool.extend_from_slice(DIGIT_CHARS);
            }

            let remaining = len.saturating_sub(required_chars.len());
            let mut password_bytes = required_chars;
            for _ in 0..remaining {
                password_bytes.push(*pool.choose(&mut rng).unwrap());
            }

            // Shuffle so required characters aren't all at the start
            password_bytes.shuffle(&mut rng);

            let val = String::from_utf8_lossy(&password_bytes).to_string();
            let pool_size = pool.len() as f64;
            let entropy = (len as f64) * pool_size.log2();
            let (score, level) = calculate_strength(entropy);

            GeneratedSecret {
                value: val,
                entropy: (entropy * 10.0).round() / 10.0,
                strength_level: level,
                score,
            }
        }
    }
}

fn calculate_strength(entropy: f64) -> (u8, String) {
    if entropy < 30.0 {
        (0, "weak".to_string())
    } else if entropy < 50.0 {
        (1, "fair".to_string())
    } else if entropy < 70.0 {
        (2, "good".to_string())
    } else if entropy < 90.0 {
        (3, "strong".to_string())
    } else {
        (4, "excellent".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_password_length() {
        let mut cfg = GeneratorConfig::default();
        cfg.length = 24;
        let secret = generate_secret(&cfg);
        assert_eq!(secret.value.len(), 24);
        assert!(secret.entropy > 70.0);
        assert!(secret.score >= 3);
    }

    #[test]
    fn test_generate_pin() {
        let mut cfg = GeneratorConfig::default();
        cfg.mode = GeneratorMode::Pin;
        cfg.length = 6;
        let secret = generate_secret(&cfg);
        assert_eq!(secret.value.len(), 6);
        assert!(secret.value.chars().all(|c| c.is_ascii_digit()));
    }

    #[test]
    fn test_generate_passphrase() {
        let mut cfg = GeneratorConfig::default();
        cfg.mode = GeneratorMode::Passphrase;
        cfg.word_count = 4;
        cfg.separator = ".".to_string();
        let secret = generate_secret(&cfg);
        let parts: Vec<&str> = secret.value.split('.').collect();
        assert_eq!(parts.len(), 4);
    }

    #[test]
    fn test_exclude_ambiguous() {
        let mut cfg = GeneratorConfig::default();
        cfg.exclude_ambiguous = true;
        cfg.length = 50;
        let secret = generate_secret(&cfg);
        for c in secret.value.chars() {
            assert!(!['0', '1', 'O', 'I', 'l'].contains(&c));
        }
    }
}
