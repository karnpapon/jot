export function Navi() {
  this.el = document.createElement("navi");
  this.child_el = document.createElement("div");
  this.el.appendChild(this.child_el);
  this.el.addEventListener("click", () => {
    jot.is_page_selected = true;
  });

  this.install = function (host) {
    host.appendChild(this.el);
  };

  this.update = async function () {
    let html = "";
    const current = this.marker();

    for (const pid in jot.project.pages) {
      const page = jot.project.pages[pid];
      if (!page) {
        continue;
      }
      const is_active = jot.project.index === parseInt(pid);

      html += `<ul class="${is_active ? "active" : ""}">`;
      html += `${
        parseInt(pid) > 0
          ? `<button title="remove" onclick='jot.project.remove(${parseInt(
              pid
            )})' class="navi-item-close-btn">x</button>`
          : "<span>&nbsp;</span>"
      }`;
      html += "<div>";
      html += await this._page(parseInt(pid), page);
      html += `<div class="marker-wrapper ${is_active ? "" : "hide"}">`;
      const markers = page.markers();
      for (const i in markers) {
        const marker = markers[i];
        html += this._marker(pid, current, marker, markers);
      }
      html += "<div>";
      html += "</div>";
      html += "</ul>";
    }
    this.child_el.innerHTML = html;
  };

  this._page = async function (id, page) {
    let _has_change = await page.has_changes();
    return `<li class='page ${
      _has_change ? "changes" : ""
    }' onclick='jot.go.to_page(${id})'><div>${page.name()}</div></li>`;
  };

  this._marker = function (pid, current, marker, markers) {
    const is_active =
      current &&
      current.line === marker.line &&
      parseInt(pid) === parseInt(jot.project.index);
    return `<li class='marker ${marker.type} ${
      is_active ? "active" : ""
    }' onclick='jot.go.to_page(${pid}, ${marker.line})'><span>${
      marker.text
    }</span></li>`;
  };

  this.next_page = function () {
    const page = clamp(
      parseInt(jot.project.index) + 1,
      0,
      jot.project.pages.length - 1
    );
    jot.go.to_page(page, 0);
  };

  this.prev_page = function () {
    const page = clamp(
      parseInt(jot.project.index) - 1,
      0,
      jot.project.pages.length - 1
    );
    jot.go.to_page(page, 0);
  };

  this.next_marker = function () {
    const page = clamp(
      parseInt(jot.project.index),
      0,
      jot.project.pages.length - 1
    );
    const marker = this.marker();

    if (!marker) {
      return;
    }

    const markers = jot.project.page().markers();
    const nextIndex = clamp(marker.id + 1, 0, markers.length - 1);

    jot.go.to_page(page, markers[nextIndex].line);
  };

  this.prev_marker = function () {
    const page = clamp(
      parseInt(jot.project.index),
      0,
      jot.project.pages.length - 1
    );
    const marker = this.marker();

    if (!marker) {
      return;
    }

    const markers = jot.project.page().markers();
    const nextIndex = clamp(marker.id - 1, 0, markers.length - 1);

    jot.go.to_page(page, markers[nextIndex].line);
  };

  this.marker = function () {
    if (!jot.project.page()) {
      return [];
    }

    const markers = jot.project.page().markers();
    const pos = jot.active_line_id();

    if (markers.length < 1) {
      return;
    }

    for (const id in markers) {
      const marker = markers[id];
      if (marker.line > pos) {
        return markers[parseInt(id) - 1];
      }
    }
    return markers[markers.length - 1];
  };

  this.on_scroll = function () {
    const scrollDistance = jot.textarea_el.scrollTop;
    const scrollMax =
      jot.textarea_el.scrollHeight - jot.textarea_el.offsetHeight;
    const scrollPerc = Math.min(
      1,
      scrollMax === 0 ? 0 : scrollDistance / scrollMax
    );
    const naviOverflowPerc = Math.max(
      0,
      jot.navi.el.scrollHeight / window.innerHeight - 1
    );

    jot.navi.el.style.transform =
      "translateY(" + -100 * scrollPerc * naviOverflowPerc + "%)";
  };

  this.toggle = function () {
    document.body.classList.toggle("mobile");
  };

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }
}
