pub mod commands;
pub mod crypto;
pub mod storage;
pub mod vault;

use std::sync::Arc;
use tauri::Manager;

use crate::commands::*;
use crate::vault::manager::VaultManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Resolve safe application data directory
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::env::current_dir().unwrap().join("tsifra_data"));

            if let Err(err) = std::fs::create_dir_all(&app_data_dir) {
                eprintln!("Warning: Failed to create app data dir: {}", err);
            }

            let vault_path = app_data_dir.join("vault.enc");
            let manager = Arc::new(VaultManager::new(vault_path));

            app.manage(manager);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_vault_status,
            init_vault,
            unlock_vault,
            lock_vault,
            get_vault_items,
            get_vault_item,
            save_vault_item,
            delete_vault_item,
            update_vault_settings,
            generate_password,
            export_vault_backup,
            import_vault_backup,
            change_vault_password
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tsifra-Seif application");
}
