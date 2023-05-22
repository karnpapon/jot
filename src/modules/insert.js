const EOL = "\n";

export function Insert() {
  this.is_active = false;

  this.start = function () {
    jot.controller.set("insert");
    this.is_active = true;
    jot.update();
  };

  this.stop = function () {
    jot.controller.set("default");
    this.is_active = false;
    jot.update();
  };

  this.time = function () {
    jot.inject(new Date().toLocaleTimeString() + " ");
    this.stop();
  };

  this.date = function () {
    const date = new Date();
    const strArray = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const d = date.getDate();
    const m = strArray[date.getMonth()];
    const y = date.getFullYear();
    const s = "" + (d <= 9 ? "0" + d : d) + "-" + m + "-" + y;
    jot.inject(s + " ");
    this.stop();
  };

  this.path = function () {
    if (jot.project.paths().length === 0) {
      this.stop();
      return;
    }

    jot.inject(jot.project.paths()[jot.project.index]);
    this.stop();
  };

  this.reference = function () {
    const word = jot.active_word().split("^");
    console.log("word", word);
    if (word.length < 2) return;
    if (!Number.isInteger(parseInt(word[1]))) return;

    const superscript = [...(word[1] + "")]
      .map((n) => +n)
      .reduce((acc, curr) => {
        acc += "⁰¹²³⁴⁵⁶⁷⁸⁹"[curr];
        return acc;
      }, "");
    const word_with_sup = word[0] + superscript;

    if (jot.prev_character() === EOL) {
      jot.inject_insert(word[0], superscript, word[1]);
    } else {
      jot.inject_insert(word[0], superscript, word[1]);
    }

    this.stop();
  };

  this.header = function () {
    const isMultiline = jot.selected().match(/[^\r\n]+/g);

    if (jot.prev_character() === EOL && !isMultiline) {
      jot.inject("# ");
    } else if (isMultiline) {
      jot.inject_multiline("# ");
    } else {
      jot.inject_line("# ");
    }
    this.stop();
  };

  this.subheader = function () {
    const isMultiline = jot.selected().match(/[^\r\n]+/g);

    if (jot.prev_character() === EOL && !isMultiline) {
      jot.inject("## ");
    } else if (isMultiline) {
      jot.inject_multiline("## ");
    } else {
      jot.inject_line("## ");
    }
    this.stop();
  };

  this.comment = function () {
    const isMultiline = jot.selected().match(/[^\r\n]+/g);

    if (jot.prev_character() === EOL && !isMultiline) {
      jot.inject("-- ");
    } else if (isMultiline) {
      jot.inject_multiline("-- ");
    } else {
      jot.inject_line("-- ");
    }
    this.stop();
  };

  this.list = function () {
    const isMultiline = jot.selected().match(/[^\r\n]+/g);

    if (jot.prev_character() === EOL && !isMultiline) {
      jot.inject("- ");
    } else if (isMultiline) {
      jot.inject_multiline("- ");
    } else {
      jot.inject_line("- ");
    }
    this.stop();
  };

  this.line = function () {
    if (jot.prev_character() !== EOL) {
      jot.inject(EOL);
    }
    jot.inject("===================== \n");
    this.stop();
  };

  this.status = function () {
    return `<b>Insert Mode</b> c-D <i>Date</i> c-T <i>Time</i> ${
      jot.project.paths().length > 0 ? "c-P <i>Path</i> " : ""
    }c-H <i>Header</i> c-/ <i>Comment</i> Esc <i>Exit</i>.`;
  };
}
