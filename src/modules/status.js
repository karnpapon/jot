const EOL = "\n";

export function Status() {
  this.el = document.createElement("stats");

  this.install = function (host) {
    host.appendChild(this.el);
  };

  this.update = function (special = "") {
    if (jot.insert.is_active) {
      this.el.innerHTML = `<div/>`;
      return;
    }
    if (jot.is_page_selected) {
      this.el.innerHTML = "";
      this.el.innerHTML = this._file_path();
      return;
    }
    if (jot.state.find) {
      this.el.innerHTML = "";
      this.el.appendChild(jot.find.el);
      jot.find.el.focus();
      return;
    }
    if (jot.textarea_el.selectionStart !== jot.textarea_el.selectionEnd) {
      this.el.innerHTML = this._selection();
    } else if (jot.synonyms) {
      this.el.innerHTML = "";
      this.el.appendChild(this._synonyms());
    } else if (jot.selection.word && jot.suggestion) {
      this.el.innerHTML = this._suggestion();
    } else if (jot.selection.url) {
      this.el.innerHTML = this._url();
    } else if (jot.selection.reference) {
      this.el.innerHTML = this._reference(jot.selection.reference);
    } else {
      this.el.innerHTML = this._default();
    }
  };

  this._default = function () {
    const date = new Date();
    return `LINE:${
      jot.textarea_el.value
        .substr(0, jot.textarea_el.selectionStart)
        .split("\n").length
    } <span class='right'>&nbsp;(${date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}, ${date.getHours()}:${("0" + date.getMinutes()).slice(-2)})</span>`;
  };

  this.incrementSynonym = function () {
    jot.selection.index = (jot.selection.index + 1) % jot.synonyms.length;
  };

  this.list = null;
  this.isSynonymsActive = false;

  this.nextSynonym = function () {
    this.isSynonymsActive = true;

    // Save the previous word element
    const previousWord = this.list.children[jot.selection.index];

    // Increment the index
    this.incrementSynonym();

    // Get the current word element, add/remove appropriate active class
    const currentWord = this.list.children[jot.selection.index];
    previousWord.classList.remove("active");
    currentWord.classList.add("active");

    currentWord.scrollIntoView({
      behavior: "smooth",
    });
  };

  this.applySynonym = function () {
    if (!this.isSynonymsActive) {
      return;
    }

    // Replace the current word with the selected synonym
    // jot.replace_active_word_with(
    //   jot.synonyms[jot.selection.index % jot.synonyms.length]
    // );
  };

  this._synonyms = function () {
    jot.selection.index = 0;

    const ul = document.createElement("ul");

    // jot.synonyms.forEach((syn) => {
    //   const li = document.createElement("li");
    //   li.textContent = syn;
    //   ul.appendChild(li);
    // });

    ul.children[0].classList.add("active");
    this.el.scrollLeft = 0;
    this.list = ul;

    return ul;
  };

  this._suggestion = function () {
    return `<t>${jot.selection.word}<b>${jot.suggestion.substr(
      jot.selection.word.length,
      jot.suggestion.length
    )}</b></t>`;
  };

  this._selection = function () {
    return `<b>[${jot.textarea_el.selectionStart},${
      jot.textarea_el.selectionEnd
    }]&nbsp;</b> ${this._default()}`;
  };

  this._file_path = function () {
    const path = jot.current_file_path;
    return `<button class="word-ref-btn" title="open file directory" onclick='jot.open_file_path()'>${
      path ?? ""
    }</button>`;
  };

  this._url = function () {
    const date = new Date();
    return `Open &nbsp;<b>${
      jot.selection.url
    }</b>&nbsp; with Cmd+b <span class='right'>&nbsp;${date.getHours()}:${date.getMinutes()}</span>`;
  };

  this._reference = function (ref) {
    let ref_data = jot.project.page().get_referece_data_obj(ref);
    if (!ref_data) {
      return `<b>[Warning]:</b>&nbsp;no '# References' section`;
    }
    if (!ref_data[ref]) {
      return `<b>[Warning]:</b>&nbsp;please check if reference number is existed or matched.`;
    }
    return `<button class="word-ref-btn" title="go to reference" onclick='jot.go.to_line(${ref_data[ref].ref_line})'>Ref ${ref_data[ref].ref_superscript}:</button> &nbsp;<b class="word-ref">${ref_data[ref].ref_text}</b>`;
  };

  this.on_scroll = function () {
    const scrollDistance = jot.textarea_el.scrollTop;
    const scrollMax =
      jot.textarea_el.scrollHeight - jot.textarea_el.offsetHeight;
    const ratio = Math.min(1, scrollMax === 0 ? 0 : scrollDistance / scrollMax);
    const progress = ["░", "░", "░", "░", "░", "░", "░", "░", "░", "░"]
      .map((v, i) => {
        return i < ratio * 10 ? "<b>▒</b>" : v;
      })
      .join("");

    this.el.innerHTML = `${progress} &nbsp; ${(ratio * 100).toFixed(2)}%`;
  };

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }
}
