import { Project } from "./project.js";
import { Go } from "./go.js";
import { Navi } from "./navi.js";
import { Stats } from "./stat.js";
import { Reader } from "./reader.js";
import { Toolbar } from "./toolbar.js";
import { Dictionary } from "./dictionary.js";
import { Insert } from "./insert.js";
import { Find } from "./find.js";
import { Operator } from "./operator.js";
import { Controller } from "./lib/controller.js";
import { Theme } from "./lib/theme.js";

const EOL = "\n";

const { shell } = window.__TAURI__;
const { open } = shell;

export function Left() {
  this.textarea_el = document.createElement("textarea");
  this.drag_el = document.createElement("drag");
  this.drag_el.setAttribute("data-tauri-drag-region", "");
  this.textarea_and_navi_el = document.createElement("main");
  this.state = {
    find: false,
  };

  // this.find_btn = document.createElement("button");
  // this.find_btn.classList.add("hl-find");
  // this.find_btn.innerText = "find text";
  // this.find_btn.addEventListener("click", () => {
  //   let arg = "and";
  //   if (arg) {
  //     hilite.search(arg);
  //   }
  // });

  this.init = function () {
    this.theme = new Theme({
      background: "#ffffff",
      f_high: "#393B3F",
      f_med: "#808790",
      f_low: "#A3A3A4",
      f_inv: "#000000",
      b_high: "#333333",
      b_med: "#777777",
      b_low: "#DDDDDD",
      b_inv: "#ffffff",
    });
    this.controller = new Controller();
    this.project = new Project();
    this.go = new Go();
    this.navi = new Navi();
    this.dictionary = new Dictionary();
    this.stats = new Stats();
    this.reader = new Reader();
    this.insert = new Insert();
    this.toolbar = new Toolbar();
    this.operator = new Operator();
    this.find = new Find();

    this.autoindent = true;
    this.selection = { word: null, index: 1 };
  };

  this.install = function (host = document.body) {
    this.navi.install(this.textarea_and_navi_el);
    this.textarea_and_navi_el.appendChild(this.textarea_el);
    this.operator.install(host);

    // host.appendChild(this.find_btn);
    host.appendChild(this.textarea_and_navi_el);
    host.appendChild(this.drag_el);

    this.toolbar.install(document.body, this.stats);
    // host.className = window.location.hash.replace("#", "");

    this.textarea_el.setAttribute("autocomplete", "off");
    this.textarea_el.setAttribute("autocorrect", "off");
    this.textarea_el.setAttribute("autocapitalize", "off");
    this.textarea_el.setAttribute("spellcheck", "false");
    this.textarea_el.setAttribute("type", "text");

    this.textarea_el.addEventListener("scroll", () => {
      if (!this.reader.active) {
        // this.stats.on_scroll();
      }
    });

    // Trigger update when selection changes
    this.textarea_el.addEventListener("select", (e) => {
      if (!this.reader.active) {
        this.update();
      }
    });

    this.textarea_el.addEventListener("input", () => {
      this.project.page().commit();
    });

    this.theme.install(host);
  };

  this.start = function () {
    // this.theme.start();
    this.theme.load(this.theme.active);
    this.project.start();
    this.go.to_page();
    this.dictionary.start();

    this.textarea_el.focus();
    this.textarea_el.setSelectionRange(0, 0);
    this.dictionary.update();
    this.update();
  };

  this.update = (hard = false) => {
    const nextChar = this.textarea_el.value.substr(
      this.textarea_el.selectionEnd,
      1
    );

    this.selection.word = this.active_word();
    this.suggestion =
      nextChar === "" || nextChar === " " || nextChar === EOL
        ? this.dictionary.find_suggestion(this.selection.word)
        : null;
    this.synonyms = this.dictionary.find_synonym(this.selection.word);
    this.selection.url = this.active_url();

    this.navi.update();
    this.project.update();
    this.stats.update();
  };

  this.reload = function (force = false) {
    this.project.page().reload(force);
    this.load(this.project.page().text);
  };

  this.load = function (text) {
    this.textarea_el.value = text || "";
    this.update();
  };

  this.select = (from, to) => {
    this.textarea_el.setSelectionRange(from, to);
  };

  this.select_word = (target) => {
    const from = this.textarea_el.value.split(target)[0].length;
    this.select(from, from + target.length);
  };

  this.select_line = function (id) {
    const lineArr = this.textarea_el.value.split(EOL, parseInt(id) + 1);
    const arrJoin = lineArr.join(EOL);

    const from = arrJoin.length - lineArr[id].length;
    const to = arrJoin.length;

    this.select(from, to);
  };

  this.active_word = () => {
    const l = this.active_word_location();
    return this.textarea_el.value.substr(l.from, l.to - l.from);
  };

  this.active_url = function () {
    const words = this.active_line().split(" ");
    for (const id in words) {
      if (words[id].indexOf("://") > -1 || words[id].indexOf("www.") > -1) {
        return words[id];
      }
    }
    return null;
  };

  this.active_word_location = (position = this.textarea_el.selectionEnd) => {
    let from = position - 1;

    // Find beginning of word
    while (from > -1) {
      const char = this.textarea_el.value[from];
      if (!char || !char.match(/[a-z]/i)) {
        break;
      }
      from -= 1;
    }

    // Find end of word
    let to = from + 1;
    while (to < from + 30) {
      const char = this.textarea_el.value[to];
      if (!char || !char.match(/[a-z]/i)) {
        break;
      }
      to += 1;
    }

    from += 1;

    return { from: from, to: to };
  };

  this.active_line = () => {
    const text = this.textarea_el.value;
    const lines = text.split(EOL);
    return lines[this.active_line_id()];
  };

  this.active_line_id = () => {
    const segments = this.textarea_el.value
      .substr(0, this.textarea_el.selectionEnd)
      .split(EOL);
    return segments.length - 1;
  };

  this.selected = function () {
    const from = this.textarea_el.selectionStart;
    const to = this.textarea_el.selectionEnd;
    const length = to - from;
    return this.textarea_el.value.substr(from, length);
  };

  this.inject = function (characters = "__") {
    const pos = this.textarea_el.selectionStart;
    this.textarea_el.setSelectionRange(pos, pos);
    document.execCommand("insertText", false, characters);
    this.update();
  };

  this.inject_line = (characters = "__") => {
    this.select_line(this.active_line_id());
    this.inject(characters);
  };

  this.prev_character = () => {
    const l = this.active_word_location();
    return this.textarea_el.value.substr(l.from - 1, 1);
  };

  this.reset = () => {
    this.theme.reset();
    // this.font.reset()
    this.update();
  };

  this.open_url = function (target = this.active_url()) {
    if (!target) {
      return;
    }

    this.select_word(target);
    setTimeout(async () => {
      await open(target);
    }, 500);
  };

  this.toggle_autoindent = () => {
    this.autoindent = !this.autoindent;
  };

  this.toggle_find = () => {
    this.state.find = !this.state.find;
    if (!this.state.find) {
      hilite.clear();
    }
  };
}
