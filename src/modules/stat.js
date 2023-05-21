const EOL = "\n";

export function Stats() {
  this.el = document.createElement("stats");

  this.install = function (host) {
    host.appendChild(this.el);
  };

  this.update = function (special = "") {
    if (left.insert.is_active) {
      this.el.innerHTML = `<div/>`;
      return;
    }
    if (left.state.find) {
      this.el.innerHTML = "";
      this.el.appendChild(left.find.el);
      left.find.el.focus();
      return;
    }
    if (left.textarea_el.selectionStart !== left.textarea_el.selectionEnd) {
      this.el.innerHTML = this._selection();
    } else if (left.synonyms) {
      this.el.innerHTML = "";
      this.el.appendChild(this._synonyms());
    } else if (left.selection.word && left.suggestion) {
      this.el.innerHTML = this._suggestion();
    } else if (left.selection.url) {
      this.el.innerHTML = this._url();
    } else {
      this.el.innerHTML = this._default();
    }
  };

  this._default = function () {
    const date = new Date();
    return `LINE:${
      left.textarea_el.value
        .substr(0, left.textarea_el.selectionStart)
        .split("\n").length
    } <span class='right'>&nbsp;(${date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}, ${date.getHours()}:${("0" + date.getMinutes()).slice(-2)})</span>`;
  };

  this.incrementSynonym = function () {
    left.selection.index = (left.selection.index + 1) % left.synonyms.length;
  };

  this.list = null;
  this.isSynonymsActive = false;

  this.nextSynonym = function () {
    this.isSynonymsActive = true;

    // Save the previous word element
    const previousWord = this.list.children[left.selection.index];

    // Increment the index
    this.incrementSynonym();

    // Get the current word element, add/remove appropriate active class
    const currentWord = this.list.children[left.selection.index];
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
    // left.replace_active_word_with(
    //   left.synonyms[left.selection.index % left.synonyms.length]
    // );
  };

  this._synonyms = function () {
    left.selection.index = 0;

    const ul = document.createElement("ul");

    // left.synonyms.forEach((syn) => {
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
    return `<t>${left.selection.word}<b>${left.suggestion.substr(
      left.selection.word.length,
      left.suggestion.length
    )}</b></t>`;
  };

  this._selection = function () {
    return `<b>[${left.textarea_el.selectionStart},${
      left.textarea_el.selectionEnd
    }]&nbsp;</b> ${this._default()}`;
  };

  this._url = function () {
    const date = new Date();
    return `Open &nbsp;<b>${
      left.selection.url
    }</b>&nbsp; with &lt;c-b&gt; <span class='right'>&nbsp;${date.getHours()}:${date.getMinutes()}</span>`;
  };

  this.on_scroll = function () {
    const scrollDistance = left.textarea_el.scrollTop;
    const scrollMax =
      left.textarea_el.scrollHeight - left.textarea_el.offsetHeight;
    const ratio = Math.min(1, scrollMax === 0 ? 0 : scrollDistance / scrollMax);
    const progress = ["|", "|", "|", "|", "|", "|", "|", "|", "|", "|"]
      .map((v, i) => {
        return i < ratio * 10 ? "<b>|</b>" : v;
      })
      .join("");

    this.el.innerHTML = `${progress} ${(ratio * 100).toFixed(2)}%`;
  };

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }
}
