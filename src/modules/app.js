import { Project } from "./project.js";
import { Go } from "./go.js";
import { Navi } from "./navi.js";
import { Stats } from "./stat.js";
import { Reader } from "./reader.js";
import { Dictionary } from "./dictionary.js";
import { Theme } from "./lib/theme.js";

const EOL = "\n";

export function Left() {
  this.textarea_el = document.createElement("textarea");
  this.drag_el = document.createElement("drag");
  this.drag_el.setAttribute("data-tauri-drag-region", "");

  this.init = function () {
    this.theme = new Theme({
      background: "#dad7cd",
      f_high: "#696861",
      f_med: "#ff5c01",
      f_low: "#b3b2ac",
      f_inv: "#43423e",
      b_high: "#43423e",
      b_med: "#c2c1bb",
      b_low: "#e5e3dc",
      b_inv: "#eb3f48",
    });
    this.project = new Project();
    this.go = new Go();
    this.navi = new Navi();
    this.dictionary = new Dictionary();
    this.stats = new Stats();
    this.reader = new Reader();

    this.autoindent = true;
    this.selection = { word: null, index: 1 };
  };

  this.install = function (host = document.body) {
    this.navi.install(host);
    this.stats.install(host);

    host.appendChild(this.textarea_el);
    host.appendChild(this.drag_el);
    // host.className = window.location.hash.replace("#", "");

    this.textarea_el.setAttribute("autocomplete", "off");
    this.textarea_el.setAttribute("autocorrect", "off");
    this.textarea_el.setAttribute("autocapitalize", "off");
    this.textarea_el.setAttribute("spellcheck", "false");
    this.textarea_el.setAttribute("type", "text");

    this.textarea_el.addEventListener("scroll", () => {
      if (!this.reader.active) {
        this.stats.on_scroll();
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
    this.theme.start();
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

  this.reset = () => {
    this.theme.reset();
    // this.font.reset()
    this.update();
  };

  this.toggle_autoindent = () => {
    this.autoindent = !this.autoindent;
  };
}
