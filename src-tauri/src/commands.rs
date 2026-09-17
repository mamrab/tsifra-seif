use std::sync::Arc;
use tauri::State;
use base64::prelude::*;

use crate::crypto::generator::{generate_secret, GeneratedSecret, GeneratorConfig};
use crate::vault::manager::VaultManager;
use crate::vault::models::{DatabaseInfo, VaultItem, VaultSettings, VaultStatus};

#[tauri::command]
pub fn get_vault_status(manager: State<'_, Arc<VaultManager>>) -> Result<VaultStatus, String> {
    Ok(manager.status())
}

#[tauri::command]
pub fn init_vault(
    password: String,
    manager: State<'_, Arc<VaultManager>>,
) -> Result<VaultStatus, String> {
    if password.trim().is_empty() {
        return Err("Пароль или PIN не может быть пустым".to_string());
    }
    manager
        .initialize(&password)
        .map_err(|e| format!("Ошибка инициализации сейфа: {}", e))
}

#[tauri::command]
pub fn unlock_vault(
    password: String,
    manager: State<'_, Arc<VaultManager>>,
) -> Result<VaultStatus, String> {
    manager
        .unlock(&password)
        .map_err(|e| format!("Ошибка разблокировки: {}", e))
}

#[tauri::command]
pub fn lock_vault(manager: State<'_, Arc<VaultManager>>) -> Result<(), String> {
    manager.lock();
    Ok(())
}

#[tauri::command]
pub fn get_vault_items(manager: State<'_, Arc<VaultManager>>) -> Result<Vec<VaultItem>, String> {
    manager
        .get_items()
        .map_err(|e| format!("Ошибка получения записей: {}", e))
}

#[tauri::command]
pub fn get_vault_item(
    id: String,
    manager: State<'_, Arc<VaultManager>>,
) -> Result<VaultItem, String> {
    manager
        .get_item(&id)
        .map_err(|e| format!("Ошибка получения записи: {}", e))
}

#[tauri::command]
pub fn save_vault_item(
    item: VaultItem,
    manager: State<'_, Arc<VaultManager>>,
) -> Result<VaultItem, String> {
    manager
        .save_item(item)
        .map_err(|e| format!("Ошибка сохранения: {}", e))
}

#[tauri::command]
pub fn delete_vault_item(
    id: String,
    manager: State<'_, Arc<VaultManager>>,
) -> Result<(), String> {
    manager
        .delete_item(&id)
        .map_err(|e| format!("Ошибка удаления: {}", e))
}

#[tauri::command]
pub fn update_vault_settings(
    settings: VaultSettings,
    manager: State<'_, Arc<VaultManager>>,
) -> Result<(), String> {
    manager
        .update_settings(settings)
        .map_err(|e| format!("Ошибка обновления настроек: {}", e))
}

#[tauri::command]
pub fn generate_password(config: GeneratorConfig) -> Result<GeneratedSecret, String> {
    Ok(generate_secret(&config))
}

#[tauri::command]
pub fn export_vault_backup(manager: State<'_, Arc<VaultManager>>) -> Result<String, String> {
    let bytes = manager
        .export_raw_backup()
        .map_err(|e| format!("Ошибка экспорта резервной копии: {}", e))?;
    Ok(BASE64_STANDARD.encode(bytes))
}

#[tauri::command]
pub fn import_vault_backup(
    backup_base64: String,
    password: String,
    manager: State<'_, Arc<VaultManager>>,
) -> Result<VaultStatus, String> {
    let bytes = BASE64_STANDARD
        .decode(backup_base64.trim())
        .map_err(|e| format!("Некорректные данные бэкапа: {}", e))?;

    manager
        .import_raw_backup(&bytes, &password)
        .map_err(|e| format!("Ошибка импорта: {}", e))
}

#[tauri::command]
pub fn change_vault_password(
    old_password: String,
    new_password: String,
    manager: State<'_, Arc<VaultManager>>,
) -> Result<(), String> {
    if new_password.trim().is_empty() {
        return Err("Новый пароль не может быть пустым".to_string());
    }
    manager
        .change_master_password(&old_password, &new_password)
        .map_err(|e| format!("Ошибка смены мастер-пароля: {}", e))
}

#[tauri::command]
pub fn list_local_databases(manager: State<'_, Arc<VaultManager>>) -> Result<Vec<DatabaseInfo>, String> {
    manager
        .list_databases()
        .map_err(|e| format!("Ошибка получения списка баз данных: {}", e))
}

#[tauri::command]
pub fn switch_local_database(
    name: String,
    manager: State<'_, Arc<VaultManager>>,
) -> Result<VaultStatus, String> {
    manager
        .switch_database(&name)
        .map_err(|e| format!("Ошибка переключения базы данных: {}", e))
}

#[tauri::command]
pub fn create_local_database(
    name: String,
    password: String,
    manager: State<'_, Arc<VaultManager>>,
) -> Result<VaultStatus, String> {
    if name.trim().is_empty() {
        return Err("Имя базы данных не может быть пустым".to_string());
    }
    if password.trim().is_empty() {
        return Err("Пароль не может быть пустым".to_string());
    }
    manager
        .create_database(&name, &password)
        .map_err(|e| format!("Ошибка создания базы данных: {}", e))
}

