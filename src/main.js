import { Left } from "/modules/app.js";

const left = new Left();
window.left = left;
left.init();
left.install(document.body);
left.start();

window.addEventListener("load", () => {
  const { invoke, event } = window.__TAURI__;
  const { listen } = event;

  listen("menu-file-new", ({ payload }) => left.project.new());
  listen("menu-file-save", ({ payload }) => left.project.save());
  listen("menu-file-open", ({ payload }) => left.project.open());
  listen("view-nav-toggle", ({ payload }) => left.navi.toggle());
});
