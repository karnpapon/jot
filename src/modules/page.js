const EOL = "\n";
const { dialog, invoke } = window.__TAURI__;

export function Page(text = "", path = null) {
  this.text = text.replace(/\r?\n/g, "\n");
  this.path = path;
  this.size = 0;
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
    if (ret && last_size !== this.size) {
      const confirmed = await dialog.confirm(
        "File was modified outside jot, do you want to reload it?"
      );
      if (!confirmed) return ret;

      this.commit(await this.load());
      jot.reload();
      return !ret;
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

  this.get_referece_data_obj = function (_ref) {
    const ref_sup = "⁰¹²³⁴⁵⁶⁷⁸⁹"[_ref];
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
      .split("# References\n")
      .get_at(1, `${ref_sup} [error]: reference number ${_ref} is undefined.`)
      .split("\n")
      .reduce(
        ({ obj, ref_line }, curr) => {
          let ref_superscript = curr.match(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/i)[0];
          const int_from_superscripts = ref_superscript
            .split("")
            .map(digitFromSuperscript);
          const ref_num = int_from_superscripts
            .map((num, i) => to_base10(int_from_superscripts, num, i))
            .reduce((a, c) => (a = c + a));

          ++ref_line;
          obj[ref_num] = {};
          obj[ref_num]["ref_text"] = curr.split(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/i)[1];
          obj[ref_num]["ref_superscript"] = ref_superscript;
          obj[ref_num]["ref_line"] = ref_line;
          return { obj, ref_line };
        },
        { obj: {}, ref_line: refs[0].line }
      );
    return lines["obj"];
  };
}

export function get(value, query, defaultVal = undefined) {
  const splitQuery = Array.isArray(query)
    ? query
    : query
        .replace(/(\[(\d)\])/g, ".$2")
        .replace(/^\./, "")
        .split(".");

  if (!splitQuery.length || splitQuery[0] === undefined) return value;

  const key = splitQuery[0];

  if (
    typeof value !== "object" ||
    value === null ||
    !(key in value) ||
    value[key] === undefined
  ) {
    return defaultVal;
  }

  return get(value[key], splitQuery.slice(1), defaultVal);
}

// prevent unintentional enumeration eg. for..in
if (!Array.prototype.get_at) {
  Object.defineProperty(Array.prototype, "get_at", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function get_at(arr_index, handle_err) {
      var res = this[arr_index];
      if (!res) {
        return handle_err;
      }
      return res;
    },
  });
}
