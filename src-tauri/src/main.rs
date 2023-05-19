#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod lib;
use crate::lib::conf::AppConf;
use crate::lib::setup;
use std::borrow::Borrow;
use std::sync::Mutex;
use tauri::{
  AboutMetadata, Assets, Context, CustomMenuItem, Manager, Menu, MenuItem, Submenu, Window,
  WindowMenuEvent,
};

pub struct XXXApp {
  // osc_states: Mutex<OscPlugin>,
}

// since Tauri is not encourage to access arbitrary filesystem path (readmore: https://tauri.app/v1/api/js/fs#security)
#[tauri::command]
fn fs_read_file(filename: &str) -> Result<String, String> {
  use std::fs;
  let file = fs::read(filename).expect("fs_read_file: error");
  let res = String::from_utf8_lossy(&file);
  Ok(format!("{}", res))
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
  let file_open = CustomMenuItem::new("FILE_OPEN".to_string(), "Open").accelerator("CmdOrCtrl+o");
  let view_nav_toggle = CustomMenuItem::new("VIEW_NAV_TOGGLE".to_string(), "Toggle Navigation")
    .accelerator("CmdOrCtrl+'");
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
      .add_native_item(MenuItem::Separator)
      .add_native_item(MenuItem::Quit),
  );

  let submenu_app = Submenu::new(
    "File",
    Menu::new()
      .add_item(file_new)
      .add_item(file_save)
      .add_item(file_open)
      .add_native_item(MenuItem::Separator)
      .add_item(view_nav_toggle)
      .add_native_item(MenuItem::Separator)
      .add_item(stay_on_top_menu),
  );

  Menu::new()
    .add_submenu(native_menu)
    .add_submenu(submenu_app)
}

fn on_ready(event: WindowMenuEvent<tauri::Wry>) {
  let win = Some(event.window()).unwrap();
  let app = win.app_handle();
  let menu_id = event.menu_item_id();
  let menu_handle = win.menu_handle();
  let state = app.state::<XXXApp>();
  // let midi_state_devices = state.midi_states.devices.lock();

  match menu_id {
    "FILE_NEW" => {
      win.emit("menu-file-new", true).unwrap();
    }
    "FILE_SAVE" => {
      win.emit("menu-file-save", true).unwrap();
    }
    "FILE_OPEN" => {
      win.emit("menu-file-open", true).unwrap();
    }
    "VIEW_NAV_TOGGLE" => {
      win.emit("view-nav-toggle", true).unwrap();
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
    .manage(XXXApp {
      // osc_states: Default::default(),
      // midi_states: Default::default(),
    })
    .invoke_handler(tauri::generate_handler![fs_read_file])
    .plugin(tauri_plugin_fs_extra::init())
    .on_menu_event(on_ready)
    .run(context)
    .expect("error while running xxx application");
  Ok(())
}
