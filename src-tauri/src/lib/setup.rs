use crate::XXXApp;

use super::conf::AppConf;
// use log::info;
use tauri::{utils::config::WindowUrl, window::WindowBuilder, App, Manager};

pub fn init(app: &mut App) -> std::result::Result<(), Box<dyn std::error::Error>> {
  // info!("setup::init");
  let app_conf = AppConf::read();
  let app = app.handle();

  tauri::async_runtime::spawn(async move {
    let mut main_win = WindowBuilder::new(&app, "core", WindowUrl::App("../../../src".into()))
      .title("jot")
      .resizable(true)
      .fullscreen(false)
      .inner_size(app_conf.main_width, app_conf.main_height)
      .always_on_top(app_conf.stay_on_top);

    #[cfg(target_os = "macos")]
    {
      main_win = main_win
        .title_bar_style(app_conf.clone().titlebar())
        .hidden_title(true);
    }

    main_win.build().unwrap();
  });
  Ok(())
}
