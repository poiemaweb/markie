mod clipboard;
mod shortcut;
mod tray;

use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            clipboard::read_clipboard_text,
            clipboard::write_clipboard_text,
        ])
        .setup(|app| {
            tray::create_tray(app.handle())?;
            shortcut::register_default_shortcut(app.handle())?;

            if let Some(window) = app.get_webview_window("main") {
                let cloned = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = cloned.hide();
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
