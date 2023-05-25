document.onkeydown = function keyDown(e) {
  jot.last_char = e.key;

  if (e.metaKey || e.ctrlKey) {
    if (e.key === "]") {
      jot.navi.next_marker();
      e.preventDefault();
      return;
    }
    if (e.key === "[") {
      jot.navi.prev_marker();
      e.preventDefault();
      return;
    }
  }

  // Reset index on space
  if (e.key === " " || e.key === "Enter") {
    jot.selection.index = 0;
  }

  if (e.key.substring(0, 5) === "Arrow") {
    setTimeout(() => jot.update(), 0); // force the refresh event to happen after the selection updates
    return;
  }

  // Slower Refresh
  if (e.key === "Enter") {
    setTimeout(() => {
      jot.update();
    }, 16);
  }
};

document.onkeyup = (e) => {
  if (e.key === "Enter" && jot.autoindent) {
    // autoindent
    let cur_pos = jot.textarea_el.selectionStart; // get new position in textarea

    // go back until beginning of last line and count spaces/tabs
    let indent = "";
    let line = "";
    for (
      let pos = cur_pos - 2; // -2 because of cur and \n
      pos >= 0 && jot.textarea_el.value.charAt(pos) != "\n";
      pos--
    ) {
      line += jot.textarea_el.value.charAt(pos);
    }

    let matches;
    if ((matches = /^.*?([\s\t]+)$/gm.exec(line)) !== null) {
      // found indent
      indent = matches[1].split("").reverse().join(""); // reverse
      jot.textarea_el.selectionStart = cur_pos;
      jot.inject(indent);
    }
  }

  if (e.keyCode === 16) {
    // Shift
    // jot.stats.applySynonym();
    jot.update();
    return;
  }
  if (e.keyCode !== 9) {
    jot.update();
  }
};

window.addEventListener("dragover", function (e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
});

window.addEventListener("drop", function (e) {
  e.stopPropagation();
  e.preventDefault();

  const files = e.dataTransfer.files;

  for (const id in files) {
    const file = files[id];
    if (!file.path) {
      continue;
    }
    if (file.type && !file.type.match(/text.*/)) {
      console.log(`Skipped ${file.type} : ${file.path}`);
      continue;
    }
    if (file.path && file.path.substr(-3, 3) === "thm") {
      continue;
    }

    jot.project.add(file.path);
  }

  jot.reload();
  jot.navi.next_page();
});

document.onclick = function onClick(e) {
  jot.selection.index = 0;
  jot.update();
};
