import { Jot } from "/modules/app.js";
import TextHighlight from "/modules/lib/texthighlighter.js";
import TextareaEditor from "/modules/lib/toolbar-editor.js";

const jot = new Jot();
window.jot = jot;
jot.init();
jot.install(document.body);
jot.start();

window.addEventListener("load", () => {
  const { event } = window.__TAURI__;
  const { listen } = event;

  // var vim = new VIM();
  // vim.attach_to(jot.textarea_el);

  listen("menu-file-new", ({ _ }) => jot.project.new());
  listen("menu-file-save", ({ _ }) => jot.project.save());
  listen("menu-file-save-as", ({ _ }) => jot.project.save_as());
  listen("menu-file-open", ({ _ }) => jot.project.open());
  listen("menu-file-find", ({ _ }) => jot.toggle_find());

  listen("view-nav-toggle", ({ _ }) => jot.navi.toggle());

  listen("mode-insert", ({ _ }) => jot.insert.start());

  listen("mode-insert-date", ({ _ }) => jot.insert.date());
  listen("mode-insert-time", ({ _ }) => jot.insert.time());
  listen("mode-insert-path", ({ _ }) => jot.insert.path());
  listen("mode-insert-header", ({ _ }) => jot.insert.header());
  listen("mode-insert-subheader", ({ _ }) => jot.insert.subheader());
  listen("mode-insert-reference", ({ _ }) => jot.insert.reference());
  listen("mode-insert-comment", ({ _ }) => jot.insert.comment());
  listen("mode-insert-stop", ({ _ }) => jot.insert.stop());

  listen("select-open-url", ({ _ }) => jot.open_url());
});

const hilite = new TextHighlight(jot.textarea_el);
window.hilite = hilite;
const toolbar = document.querySelector(".toolbar");
const editor = new TextareaEditor(jot.textarea_el);

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
