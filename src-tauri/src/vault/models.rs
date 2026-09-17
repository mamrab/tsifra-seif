use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum VaultItemType {
    Password,
    SecureNote,
    PaymentCard,
    ServerKey,
    Document,
    CryptoWallet,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CryptoWalletData {
    pub network: String,
    pub word_count: usize,
    pub words: Vec<String>,
    pub address: Option<String>,
    pub derivation_path: Option<String>,
    pub passphrase: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CustomField {
    pub id: String,
    pub label: String,
    pub value: String,
    pub is_secret: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VaultItem {
    pub id: String,
    pub title: String,
    pub item_type: VaultItemType,
    pub username: Option<String>,
    pub password: Option<String>,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub category: String,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub custom_fields: Vec<CustomField>,
    pub crypto_data: Option<CryptoWalletData>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl VaultItem {
    pub fn new(title: String, item_type: VaultItemType, category: String) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            item_type,
            username: None,
            password: None,
            url: None,
            notes: None,
            category,
            tags: Vec::new(),
            favorite: false,
            custom_fields: Vec::new(),
            crypto_data: None,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VaultSettings {
    pub auto_lock_minutes: u32,
    pub lock_on_background: bool,
    pub biometrics_enabled: bool,
    pub clipboard_clear_seconds: u32,
    pub theme: String,
}

impl Default for VaultSettings {
    fn default() -> Self {
        Self {
            auto_lock_minutes: 5,
            lock_on_background: true,
            biometrics_enabled: false,
            clipboard_clear_seconds: 30,
            theme: "monochrome".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VaultData {
    pub version: u32,
    pub items: Vec<VaultItem>,
    pub categories: Vec<String>,
    pub settings: VaultSettings,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for VaultData {
    fn default() -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            version: 1,
            items: Vec::new(),
            categories: vec![
                "Общие".to_string(),
                "Крипта".to_string(),
                "Финансы".to_string(),
                "Работа".to_string(),
                "Соцсети".to_string(),
                "Личное".to_string(),
            ],
            settings: VaultSettings::default(),
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseInfo {
    pub name: String,
    pub filename: String,
    pub size_bytes: u64,
    pub is_current: bool,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultStatus {
    pub is_initialized: bool,
    pub is_unlocked: bool,
    pub item_count: usize,
    pub categories: Vec<String>,
    pub auto_lock_minutes: u32,
    pub biometrics_enabled: bool,
    pub current_database: String,
    pub last_modified: Option<i64>,
}
