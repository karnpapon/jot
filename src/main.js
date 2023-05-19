import { Left } from "/modules/app.js";
import TextareaEditor from "/modules/lib/editor.js";

const left = new Left();
window.left = left;
left.init();
left.install(document.body);
left.start();

window.addEventListener("load", () => {
  const { event } = window.__TAURI__;
  const { listen } = event;

  // var vim = new VIM();
  // vim.attach_to(left.textarea_el);

  listen("menu-file-new", ({ _ }) => left.project.new());
  listen("menu-file-save", ({ _ }) => left.project.save());
  listen("menu-file-open", ({ _ }) => left.project.open());
  listen("view-nav-toggle", ({ _ }) => left.navi.toggle());

  listen("mode-reader", ({ _ }) => left.reader.start());
  listen("mode-insert", ({ _ }) => left.insert.start());

  listen("mode-insert-date", ({ _ }) => left.insert.date());
  listen("mode-insert-time", ({ _ }) => left.insert.time());
  listen("mode-insert-path", ({ _ }) => left.insert.path());
  listen("mode-insert-header", ({ _ }) => left.insert.header());
  listen("mode-insert-subheader", ({ _ }) => left.insert.subheader());
  listen("mode-insert-comment", ({ _ }) => left.insert.comment());
  listen("mode-insert-stop", ({ _ }) => left.insert.stop());

  listen("select-open-url", ({ _ }) => left.open_url());
});

// const textarea = document.querySelector("textarea");
const toolbar = document.querySelector(".toolbar");
const editor = new TextareaEditor(left.textarea_el);

toolbar.addEventListener("mousedown", (e) => e.preventDefault());

toolbar.addEventListener("click", (e) => {
  const command = e.target.getAttribute("data-command");
  console.log("command", command);
  if (!command) return;

  let url;

  if (/image|link/.test(command) && !editor.hasFormat(command)) {
    url = prompt("URL:");
  }

  editor.toggle(command, url);
});
