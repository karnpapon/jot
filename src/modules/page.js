const EOL = "\n";
const { dialog, invoke } = window.__TAURI__;

export function Page(text = "", path = null) {
  this.text = text.replace(/\r?\n/g, "\n");
  this.path = path;
  this.size = 0;
  this.watchdog = true;
  this.disabled = false;

  this.name = function () {
    if (!this.path) {
      return "Untitled";
    }

    const parts = this.path.replace(/\\/g, "/").split("/");
    return parts[parts.length - 1];
  };

  this.has_changes = async function () {
    if (!this.path) {
      if (this.text && this.text.length > 0) {
        return true;
      }
      return false;
    }

    const last_size = this.size;
    const _ret = await this.load();
    const ret = _ret !== this.text;

    // was this change done outside Jot?
    if (ret && last_size !== this.size && this.watchdog) {
      const response = dialog
        .message("File was modified outside Jot. Do you want to reload it?", {
          type: "info",
          title: "Confirm",
          // detail: `New size of file is: ${this.size} bytes.`,
        })
        .then(async (res) => {
          if (response === 0) {
            this.commit(await this.load());
            jot.reload();
            return !ret; // return false as it was reloaded
          } else if (response === 2) this.watchdog = !this.watchdog;
        });
    }
    return ret;
  };

  this.commit = function (text = jot.textarea_el.value) {
    this.text = text;
  };

  this.reload = async function (force = false) {
    if (!this.path) {
      return;
    }

    if (!this.has_changes() || force) {
      this.commit(await this.load());
    }
  };

  this.load = async function () {
    if (!this.path) {
      return;
    }
    let data;
    try {
      data = await invoke("fs_read_file", { filename: this.path });
    } catch (err) {
      this.path = null;
      return;
    }

    // update file size
    try {
      let metadata = await this.metadata(this.path);
      this.size = metadata.size;
    } catch (err) {
      console.warn(`load: Could not read metadata file ${path}`);
      return;
    }
    return data;
  };

  this.metadata = async function (path) {
    return await invoke("plugin:fs-extra|metadata", {
      path,
    }).then((metadata) => {
      const { accessedAtMs, createdAtMs, modifiedAtMs, ...data } = metadata;
      return {
        accessedAt: new Date(accessedAtMs),
        createdAt: new Date(createdAtMs),
        modifiedAt: new Date(modifiedAtMs),
        ...data,
      };
    });
  };

  this.markers = function () {
    const a = [];
    const lines = this.text.split(EOL);
    for (const id in lines) {
      const line = lines[id].trim();
      if (line.substring(0, 3) === "###") {
        a.push({
          id: a.length,
          text: line.replace("###", "").trim(),
          line: parseInt(id),
          type: "h3",
        });
      } else if (line.substring(0, 2) === "##") {
        a.push({
          id: a.length,
          text: line.replace("##", "").trim(),
          line: parseInt(id),
          type: "subheader",
        });
      } else if (line.substring(0, 1) === "#") {
        a.push({
          id: a.length,
          text: line.replace("#", "").trim(),
          line: parseInt(id),
          type: "header",
        });
      }
    }
    return a;
  };

  this.get_referece_data_obj = function () {
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

    const markers = this.markers();
    const refs = markers.filter((m) => m.text === "References");
    if (refs.length === 0) return;

    const lines = this.text
      .trimEnd()
      .split("# References\n")[1]
      .split("\n")
      .reduce((acc, curr) => {
        let ref_superscript = curr.match(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/i)[0];
        const int_from_superscripts = ref_superscript
          .split("")
          .map(digitFromSuperscript);
        const ref_num = int_from_superscripts
          .map((num, i) => to_base10(int_from_superscripts, num, i))
          .reduce((acc, curr) => (acc = curr + acc));

        acc[ref_num] = {};
        acc[ref_num]["ref_text"] = curr.split(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/i)[1];
        acc[ref_num]["ref_superscript"] = ref_superscript;
        return acc;
      }, {});
    return lines;
  };
}
