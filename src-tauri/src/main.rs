#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod lib;
use std::path::Path;

use crate::lib::conf::AppConf;
use crate::lib::setup;
// use std::borrow::Borrow;
use std::process::Command;
use tauri::{
  AboutMetadata, Assets, Context, CustomMenuItem, Manager, Menu, MenuItem, Submenu, Window,
  WindowMenuEvent,
};

pub struct JotApp {}

// since Tauri is not encourage to access arbitrary filesystem path (readmore: https://tauri.app/v1/api/js/fs#security)
#[tauri::command]
fn fs_read_file(filename: &str) -> Result<String, String> {
  use std::fs;
  if Path::new(filename).exists() {
    let file = fs::read(filename).expect("fs_read_file: error");
    let res = String::from_utf8_lossy(&file);
    return Ok(format!("{}", res));
  }

  Ok("fs_read_file::no_file_exist".to_string())
}

#[tauri::command]
fn show_in_folder(path: String) {
  #[cfg(target_os = "windows")]
  {
    Command::new("explorer")
      .args(["/select,", &path]) // The comma after select is not a typo
      .spawn()
      .unwrap();
  }

  #[cfg(target_os = "linux")]
  {
    use std::fs::metadata;
    use std::path::PathBuf;
    if path.contains(",") {
      // see https://gitlab.freedesktop.org/dbus/dbus/-/issues/76
      let new_path = match metadata(&path).unwrap().is_dir() {
        true => path,
        false => {
          let mut path2 = PathBuf::from(path);
          path2.pop();
          path2.into_os_string().into_string().unwrap()
        }
      };
      Command::new("xdg-open").arg(&new_path).spawn().unwrap();
    } else {
      Command::new("dbus-send")
        .args([
          "--session",
          "--dest=org.freedesktop.FileManager1",
          "--type=method_call",
          "/org/freedesktop/FileManager1",
          "org.freedesktop.FileManager1.ShowItems",
          format!("array:string:\"file://{path}\"").as_str(),
          "string:\"\"",
        ])
        .spawn()
        .unwrap();
    }
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open").args(["-R", &path]).spawn().unwrap();
  }
}

// #[tauri::command]
// fn fs_write_file(filename: &str, contents: &str) -> Result<String, String> {
//   use std::fs;
//   fs::write(filename, contents).expect("fs_write_file: error");
//   Ok("fs_write_file: success".to_string())
// }

fn menu<A: Assets>(ctx: &Context<A>) -> Menu {
  let app_conf = AppConf::read();
  let file_new = CustomMenuItem::new("FILE_NEW".to_string(), "New").accelerator("CmdOrCtrl+n");
  let file_save = CustomMenuItem::new("FILE_SAVE".to_string(), "Save").accelerator("CmdOrCtrl+s");
  let file_save_as =
    CustomMenuItem::new("FILE_SAVE_AS".to_string(), "Save As").accelerator("CmdOrCtrl+Shift+s");
  let file_open = CustomMenuItem::new("FILE_OPEN".to_string(), "Open").accelerator("CmdOrCtrl+o");
  let file_find = CustomMenuItem::new("FILE_FIND".to_string(), "Find").accelerator("CmdOrCtrl+f");

  let mode_insert =
    CustomMenuItem::new("MODE_INSERT".to_string(), "Insert").accelerator("CmdOrCtrl+i");

  let mode_insert_date =
    CustomMenuItem::new("MODE_INSERT_DATE".to_string(), "Date").accelerator("CmdOrCtrl+d");
  let mode_insert_time =
    CustomMenuItem::new("MODE_INSERT_TIME".to_string(), "Time").accelerator("CmdOrCtrl+t");
  let mode_insert_path =
    CustomMenuItem::new("MODE_INSERT_PATH".to_string(), "Path").accelerator("CmdOrCtrl+p");
  let mode_insert_header =
    CustomMenuItem::new("MODE_INSERT_HEADER".to_string(), "Header").accelerator("CmdOrCtrl+h");
  let mode_insert_subheader = CustomMenuItem::new("MODE_INSERT_SUBHEADER".to_string(), "SubHeader")
    .accelerator("CmdOrCtrl+Shift+h");
  let mode_insert_comment =
    CustomMenuItem::new("MODE_INSERT_COMMENT".to_string(), "Comment").accelerator("CmdOrCtrl+/");
  let mode_insert_stop =
    CustomMenuItem::new("MODE_INSERT_STOP".to_string(), "Stop").accelerator("Esc");
  let mode_insert_reference = CustomMenuItem::new("MODE_INSERT_REFERENCE".to_string(), "Reference")
    .accelerator("CmdOrCtrl+Shift+6");

  let select_open_url =
    CustomMenuItem::new("SELECT_OPEN_URL".to_string(), "Open Url").accelerator("CmdOrCtrl+b");

  let view_nav_toggle = CustomMenuItem::new("VIEW_NAV_TOGGLE".to_string(), "Toggle Navigation")
    .accelerator("CmdOrCtrl+'");
  let view_nav_toggle_theme = CustomMenuItem::new(
    "VIEW_NAV_TOGGLE_THEME".to_string(),
    "Toggle DarkMode/LightMode",
  )
  .accelerator("CmdOrCtrl+Shift+;");
  let stay_on_top = CustomMenuItem::new("STAY_ON_TOP".to_string(), "Stay On Top");
  let stay_on_top_menu = if app_conf.stay_on_top {
    stay_on_top.selected()
  } else {
    stay_on_top
  };

  let native_menu = Submenu::new(
    "",
    Menu::new()
      .add_native_item(MenuItem::About(
        ctx.package_info().name.clone(),
        AboutMetadata::default(),
      ))
      .add_native_item(MenuItem::Copy)
      .add_native_item(MenuItem::Paste)
      .add_native_item(MenuItem::Undo)
      .add_native_item(MenuItem::Redo)
      .add_native_item(MenuItem::Cut)
      .add_native_item(MenuItem::SelectAll)
      .add_native_item(MenuItem::Separator)
      .add_native_item(MenuItem::Quit),
  );

  let submenu_app = Submenu::new(
    "File",
    Menu::new()
      .add_item(file_new)
      .add_item(file_save)
      .add_item(file_save_as)
      .add_item(file_open)
      .add_native_item(MenuItem::Separator)
      .add_item(file_find)
      .add_native_item(MenuItem::Separator)
      .add_item(view_nav_toggle)
      .add_item(view_nav_toggle_theme)
      .add_native_item(MenuItem::Separator)
      .add_item(stay_on_top_menu),
  );

  let submenu_mode = Submenu::new("Mode", Menu::new().add_item(mode_insert));

  let submenu_select = Submenu::new("Select", Menu::new().add_item(select_open_url));

  let submenu_mode_insert = Submenu::new(
    "Insert",
    Menu::new()
      .add_item(mode_insert_date)
      .add_item(mode_insert_time)
      .add_item(mode_insert_path)
      .add_item(mode_insert_header)
      .add_item(mode_insert_subheader)
      .add_item(mode_insert_reference)
      .add_item(mode_insert_comment)
      .add_item(mode_insert_stop),
  );

  Menu::new()
    .add_submenu(native_menu)
    .add_submenu(submenu_app)
    .add_submenu(submenu_mode)
    .add_submenu(submenu_mode_insert)
    .add_submenu(submenu_select)
}

fn on_ready(event: WindowMenuEvent<tauri::Wry>) {
  let win = Some(event.window()).unwrap();
  let app = win.app_handle();
  let menu_id = event.menu_item_id();
  let menu_handle = win.menu_handle();
  let state = app.state::<JotApp>();
  // let midi_state_devices = state.midi_states.devices.lock();

  match menu_id {
    "FILE_NEW" => {
      win.emit("menu-file-new", true).unwrap();
    }
    "FILE_SAVE" => {
      win.emit("menu-file-save", true).unwrap();
    }
    "FILE_SAVE_AS" => {
      win.emit("menu-file-save-as", true).unwrap();
    }
    "FILE_OPEN" => {
      win.emit("menu-file-open", true).unwrap();
    }
    "FILE_FIND" => {
      win.emit("menu-file-find", true).unwrap();
    }
    "VIEW_NAV_TOGGLE" => {
      win.emit("view-nav-toggle", true).unwrap();
    }
    "VIEW_NAV_TOGGLE_THEME" => {
      win.emit("view-nav-toggle-theme", true).unwrap();
    }
    "MODE_INSERT" => {
      win.emit("mode-insert", true).unwrap();
    }
    "MODE_INSERT_DATE" => {
      win.emit("mode-insert-date", true).unwrap();
    }
    "MODE_INSERT_TIME" => {
      win.emit("mode-insert-time", true).unwrap();
    }
    "MODE_INSERT_PATH" => {
      win.emit("mode-insert-path", true).unwrap();
    }
    "MODE_INSERT_HEADER" => {
      win.emit("mode-insert-header", true).unwrap();
    }
    "MODE_INSERT_SUBHEADER" => {
      win.emit("mode-insert-subheader", true).unwrap();
    }
    "MODE_INSERT_COMMENT" => {
      win.emit("mode-insert-comment", true).unwrap();
    }
    "MODE_INSERT_REFERENCE" => {
      win.emit("mode-insert-reference", true).unwrap();
    }
    "MODE_INSERT_STOP" => {
      win.emit("mode-insert-stop", true).unwrap();
    }
    "SELECT_OPEN_URL" => {
      win.emit("select-open-url", true).unwrap();
    }
    "STAY_ON_TOP" => {
      let app_conf = AppConf::read();
      let stay_on_top = !app_conf.stay_on_top;
      menu_handle
        .get_item(menu_id)
        .set_selected(stay_on_top)
        .unwrap();
      win.set_always_on_top(stay_on_top).unwrap();
      app_conf
        .amend(serde_json::json!({ "stay_on_top": stay_on_top }))
        .write();
    }
    _ => {}
  }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
  let context = tauri::generate_context!();
  AppConf::read().write();
  tauri::Builder::default()
    .setup(setup::init)
    .menu(menu(&context))
    .manage(JotApp {})
    .invoke_handler(tauri::generate_handler![fs_read_file, show_in_folder])
    .plugin(tauri_plugin_fs_extra::init())
    .on_menu_event(on_ready)
    .run(context)
    .expect("error while running xxx application");
  Ok(())
}
