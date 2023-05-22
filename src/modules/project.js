import { Page } from "./page.js";
import { Helper } from "./helper.js";
const { dialog, fs, invoke } = window.__TAURI__;
const { BaseDirectory } = fs;

export function Project() {
  this.pages = [];
  this.index = 0;
  this.original = "";

  this.start = function () {
    // Load previous files
    if (localStorage.hasOwnProperty("paths")) {
      if (isJSON(localStorage.getItem("paths"))) {
        const paths = JSON.parse(localStorage.getItem("paths"));
        for (const id in paths) {
          jot.project.add(paths[id]);
        }
      }
    }

    // Add Helper
    if (this.pages.length === 0) {
      jot.project.pages.push(new Helper());
      jot.go.to_page(0);
    }
  };

  this.add = async function (path = null) {
    console.log(`Adding page(${path})`);

    // this.remove_helper();

    let page = new Page();

    if (path) {
      if (this.paths().indexOf(path) > -1) {
        console.warn(`Already open(skipped): ${path}`);
        return;
      }

      let txts;

      try {
        txts = await this.load(path);
        if (txts === "fs_read_file::no_file_exist") return;
      } catch (err) {
        console.warn(`cannot load file: ${path}`);
      }
      page = new Page(txts, path);
    }

    this.pages.push(page);
    jot.go.to_page(this.pages.length - 1);

    localStorage.setItem("paths", JSON.stringify(this.paths()));
  };

  this.remove = async function (pid) {
    const confirmed = await dialog.confirm("remove from navigator panel?");
    if (!confirmed) return;

    if (localStorage.hasOwnProperty("paths")) {
      if (isJSON(localStorage.getItem("paths"))) {
        this.pages.splice(pid, 1);
        localStorage.setItem("paths", JSON.stringify(this.paths()));
      }
    }
    setTimeout(() => {
      jot.navi.next_page();
      jot.update();
    }, 200);
  };

  this.page = function () {
    return this.pages[this.index];
  };

  this.update = function () {
    if (!this.page()) {
      console.warn("Missing page");
      return;
    }

    this.page().commit(jot.textarea_el.value);
  };

  this.load = async function (path) {
    let data;
    try {
      data = await invoke("fs_read_file", { filename: path });
    } catch (err) {
      console.warn(`Could not load ${path}`);
      return;
    }
    return data;
  };

  // ========================

  this.new = function () {
    console.log("New Page");

    this.add();
    jot.reload();

    setTimeout(() => {
      jot.navi.next_page();
      jot.textarea_el.focus();
    }, 200);
  };

  this.open = async function () {
    console.log("Open Pages");

    const paths = await dialog.open({
      multiple: true,
      filters: [
        {
          name: "openfile",
          extensions: ["txt", "md", "doc", "docx", "rft", "rtf"],
        },
      ],
    });

    if (!paths) {
      console.log("Nothing to load");
      return;
    }

    for (const id in paths) {
      this.add(paths[id]);
    }

    setTimeout(() => {
      jot.navi.next_page();
      jot.update();
    }, 200);
  };

  this.save = function () {
    console.log("Save Page");

    const page = this.page();

    if (!page.path) {
      this.save_as();
      return;
    }

    fs.writeFile(page.path, page.text, (err) => {
      if (err) {
        alert("An error ocurred updating the file" + err.message);
        console.log(err);
        return;
      }
      jot.update();
      setTimeout(() => {
        jot.stats.el.innerHTML = `<b>Saved</b> ${page.path}`;
      }, 200);
    });
  };

  this.save_as = async function () {
    console.log("Save As Page");

    const page = this.page();
    const path = await dialog.save({
      filters: [
        {
          name: "save-file-0",
          extensions: ["txt", "md", "doc", "docx", "rft", "rtf"],
        },
      ],
    });

    if (!path) {
      console.log("Nothing to save");
      return;
    }

    fs.writeFile(path, page.text)
      .then((res) => {
        if (!page.path) {
          page.path = path;
        } else if (page.path !== path) {
          jot.project.pages.push(new Page(page.text, path));
        }
        jot.update();
        setTimeout(() => {
          jot.stats.el.innerHTML = `<b>Saved</b> ${page.path}`;
        }, 200);
      })
      .catch((err) => {
        alert("An error ocurred creating the file " + err.message);
      });
  };

  this.close = function () {
    if (this.pages.length === 1) {
      console.warn("Cannot close");
      return;
    }

    // if (this.page().has_changes()) {
    //   const response = dialog.showMessageBoxSync(app.win, {
    //     type: "question",
    //     buttons: ["Yes", "No"],
    //     title: "Confirm",
    //     message: "Are you sure you want to discard changes?",
    //     icon: `${app.getAppPath()}/icon.png`,
    //   });
    //   if (response !== 0) {
    //     return;
    //   }
    // }
    this.force_close();
    localStorage.setItem("paths", JSON.stringify(this.paths()));
  };

  this.force_close = function () {
    if (this.pages.length === 1) {
      this.quit();
      return;
    }

    console.log("Closing..");

    this.pages.splice(this.index, 1);
    jot.go.to_page(this.index - 1);
  };

  this.discard = function () {
    // const response = dialog.showMessageBoxSync(app.win, {
    //   type: "question",
    //   buttons: ["Yes", "No"],
    //   title: "Confirm",
    //   message: "Are you sure you want to discard changes?",
    //   icon: `${app.getAppPath()}/icon.png`,
    // });
    if (response === 0) {
      // Runs the following if 'Yes' is clicked
      jot.reload(true);
    }
  };

  this.has_changes = function () {
    for (const id in this.pages) {
      if (this.pages[id].has_changes()) {
        return true;
      }
    }
    return false;
  };

  this.quit = function () {
    if (this.has_changes()) {
      this.quit_dialog();
    } else {
      // app.exit();
    }
  };

  this.quit_dialog = function () {
    // const response = dialog.showMessageBoxSync(app.win, {
    //   type: "question",
    //   buttons: ["Yes", "No"],
    //   title: "Confirm",
    //   message: "Unsaved data will be lost. Are you sure you want to quit?",
    //   icon: `${app.getAppPath()}/icon.png`,
    // });
    // if (response === 0) {
    //   app.exit();
    // }
  };

  this.remove_helper = function () {
    for (const id in this.pages) {
      const page = this.pages[id];
      if (page.text === new Helper().text) {
        this.pages.splice(0, 1);
        return;
      }
    }
  };

  this.paths = function () {
    const a = [];
    for (const id in this.pages) {
      const page = this.pages[id];
      if (page.path) {
        a.push(page.path);
      }
    }
    return a;
  };

  function isJSON(text) {
    try {
      JSON.parse(text);
      return true;
    } catch (error) {
      return false;
    }
  }
}
