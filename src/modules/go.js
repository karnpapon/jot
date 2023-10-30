const EOL = "\n";

export function Go() {
  this.to_page = function (id = 0, line = 0) {
    const _paths = localStorage.paths ? JSON.parse(localStorage.paths) : "";
    const path = id === 0 ? "" : _paths[id - 1];
    jot.current_file_path = path; // store current file dir

    jot.project.index = clamp(parseInt(id), 0, jot.project.pages.length - 1);

    console.log(`Go to page:${jot.project.index}/${jot.project.pages.length}`);

    const page = jot.project.page();

    if (!page) {
      console.warn("Missing page", this.index);
      return;
    }
    jot.load(page.text, page.disabled);
    jot.go.to_line(line);
    jot.update();
  };

  this.to_line = function (id) {
    const lineArr = jot.textarea_el.value.split(EOL, parseInt(id) + 1);
    const arrJoin = lineArr.join(EOL);
    if (!lineArr[id]) return;
    const from = arrJoin.length - lineArr[id].length;
    const to = arrJoin.length;

    this.to(from, to);
  };

  this.to = function (from, to, scroll = true) {
    if (jot.textarea_el.setSelectionRange) {
      jot.textarea_el.setSelectionRange(from, to);
    } else if (jot.textarea_el.createTextRange) {
      const range = jot.textarea_el.createTextRange();
      range.collapse(true);
      range.moveEnd("character", to);
      range.moveStart("character", from);
      range.select();
    }
    jot.textarea_el.focus();

    if (scroll) {
      this.scroll_to(from, to);
    }

    return from === -1 ? null : from;
  };

  this.to_next = function (str, scroll = true) {
    const ta = jot.textarea_el;
    const text = ta.value;
    const range = text.substr(
      ta.selectionStart,
      text.length - ta.selectionStart
    );
    const next = ta.selectionStart + range.indexOf(EOL);
    this.to(next, next, scroll);
  };

  this.scroll_to = function (from, to) {
    const textVal = jot.textarea_el.value;
    const div = document.createElement("div");
    div.innerHTML = textVal.slice(0, to);
    document.body.appendChild(div);
    // animateScrollTo(jot.textarea_el, div.offsetHeight - 60, 200);
    jot.textarea_el.scrollTop = div.offsetHeight - 60;
    div.remove();
  };

  // t = current time
  // b = start value
  // c = change in value
  // d = duration

  Math.easeInOutQuad = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  };

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }
}
