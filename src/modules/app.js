import { Project } from "./project.js";
import { Go } from "./go.js";
import { Navi } from "./navi.js";
import { Status } from "./status.js";
import { Toolbar } from "./toolbar.js";
import { Insert } from "./insert.js";
import { Find } from "./find.js";
import { Theme } from "./lib/theme.js";

const EOL = "\n";

const { shell, invoke } = window.__TAURI__;
const { open } = shell;

export function Jot() {
  this.textarea_el = document.createElement("textarea");
  this.drag_el = document.createElement("drag");
  this.drag_el.setAttribute("data-tauri-drag-region", "");
  this.textarea_and_navi_el = document.createElement("main");
  this.is_page_selected = false;
  this.current_file_path = "";
  this.state = {
    find: false,
  };

  this.textarea_and_navi_el.addEventListener("click", () => {
    if (jot.project.index === 0) {
      jot.is_page_selected = false;
    }
  });

  this.textarea_el.addEventListener("click", () => {
    jot.is_page_selected = false;
  });

  this.init = function () {
    this.theme = new Theme();
    this.project = new Project();
    this.go = new Go();
    this.navi = new Navi();
    this.stats = new Status();
    this.insert = new Insert();
    this.toolbar = new Toolbar();
    this.find = new Find();

    this.autoindent = true;
    this.selection = { word: null, index: 1, reference: null };
  };

  this.install = function (host = document.body) {
    this.navi.install(this.textarea_and_navi_el);
    this.textarea_and_navi_el.appendChild(this.textarea_el);
    host.appendChild(this.textarea_and_navi_el);
    host.appendChild(this.drag_el);

    this.toolbar.install(document.body, this.stats);

    this.textarea_el.setAttribute("autocomplete", "off");
    this.textarea_el.setAttribute("autocorrect", "off");
    this.textarea_el.setAttribute("autocapitalize", "off");
    this.textarea_el.setAttribute("spellcheck", "false");
    this.textarea_el.setAttribute("type", "text");

    this.textarea_el.addEventListener("scroll", () => {
      this.stats.on_scroll();
    });

    this.textarea_el.addEventListener("select", (e) => {
      this.update();
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

    this.textarea_el.focus();
    this.textarea_el.setSelectionRange(0, 0);
    this.update();
  };

  this.update = (hard = false) => {
    // const nextChar = this.textarea_el.value.substring(
    //   this.textarea_el.selectionEnd,
    //   this.textarea_el.selectionEnd + 1
    // );

    this.selection.word = this.active_word();
    this.selection.url = this.active_url();
    this.selection.reference = this.active_reference();

    this.navi.update();
    this.project.update();
    this.stats.update();
  };

  this.reload = function (force = false) {
    this.project.page().reload(force);
    this.load(this.project.page().text, this.project.page().disabled);
  };

  this.load = function (text, disabled = false) {
    this.textarea_el.value = text || "";
    if (disabled) {
      this.textarea_el.setAttribute("disabled", "");
    } else {
      this.textarea_el.removeAttribute("disabled", "");
    }
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
    return this.textarea_el.value.substring(l.from, l.to);
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

  this.active_reference = function () {
    function digitFromSuperscript(superChar) {
      var result = "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(superChar);
      if (result > -1) {
        return result;
      } else {
        return superChar;
      }
    }

    function to_base10(int_from_superscripts, num, i) {
      return num * Math.pow(10, int_from_superscripts.length - 1 - i);
    }

    const position = this.active_word_location();
    let from = position.from;

    // Find end of word
    let to = from + 1;
    while (to < from + 30) {
      const char = this.textarea_el.value[to];
      if (!char || !char.match(/[a-z]|[⁰¹²³⁴⁵⁶⁷⁸⁹]/i)) {
        break;
      }
      to += 1;
    }

    const word = this.textarea_el.value.substring(from, to);
    const w = word.match(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/i);
    if (w === null) return null;

    const int_from_superscripts = w[0].split("").map(digitFromSuperscript);
    const ref_num = int_from_superscripts
      .map((num, i) => to_base10(int_from_superscripts, num, i))
      .reduce((acc, curr) => (acc = curr + acc));

    return ref_num;
  };

  this.active_word_location = (position = this.textarea_el.selectionEnd) => {
    let from = position - 1;

    // Find beginning of word
    while (from > -1) {
      const char = this.textarea_el.value[from];
      if (!char || !char.match(/[a-z]|[\^\d+]/i)) {
        break;
      }
      from -= 1;
    }

    // Find end of word
    let to = from + 1;
    while (to < from + 30) {
      const char = this.textarea_el.value[to];
      if (!char || !char.match(/[a-z]|[\^\d+]/i)) {
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
    return this.textarea_el.value.substring(from, to);
  };

  this.inject = function (characters = "__") {
    const pos_start = this.textarea_el.selectionStart || 0;
    const pos_end = this.textarea_el.selectionEnd || 0;
    this.textarea_el.focus();
    this.textarea_el.setSelectionRange(pos_start, pos_end);
    document.execCommand("insertText", false, characters);
    this.update();
  };

  this.inject_manual_insert = function (fn = () => {}) {
    const l = this.active_word_location();
    this.textarea_el.focus();
    this.textarea_el.setSelectionRange(l.from, l.to);
    fn();
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

  this.open_file_path = async function () {
    if (!this.current_file_path) {
      return;
    }
    try {
      await invoke("show_in_folder", { path: this.current_file_path });
    } catch (err) {
      console.warn(`Could not open file`);
      return;
    }
  };
}
