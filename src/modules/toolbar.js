export function Toolbar() {
  this.toolbar_wrapper_el = document.createElement("toolbar");
  this.toolbar_el = document.createElement("ul");
  this.toolbar_el.classList.add("toolbar");

  this.toolbar_bold = document.createElement("li");
  this.toolbar_bold.innerHTML =
    '<li><button type="button" data-command="bold">B</button></li>';
  this.toolbar_italic = document.createElement("li");
  this.toolbar_italic.innerHTML =
    '<li><button type="button" data-command="italic">I</button></li>';
  this.toolbar_link = document.createElement("li");
  this.toolbar_link.innerHTML =
    '<li><button type="button" data-command="link">@</button></li>';
  this.toolbar_image = document.createElement("li");
  this.toolbar_image.innerHTML =
    '<li><button type="button" data-command="image">img</button></li>';
  this.toolbar_header1 = document.createElement("li");
  this.toolbar_header1.innerHTML =
    '<li><button type="button" data-command="header1">h1</button></li>';
  this.toolbar_header2 = document.createElement("li");
  this.toolbar_header2.innerHTML =
    '<li><button type="button" data-command="header2">h2</button></li>';
  this.toolbar_unorderedList = document.createElement("li");
  this.toolbar_unorderedList.innerHTML =
    '<li><button type="button" data-command="unorderedList">ul</button></li>';
  this.toolbar_orderedList = document.createElement("li");
  this.toolbar_orderedList.innerHTML =
    '<li><button type="button" data-command="orderedList">ol</button></li>';
  this.toolbar_code = document.createElement("li");
  this.toolbar_code.innerHTML =
    '<li><button type="button" data-command="code">&lt;&gt;</button></li>';

  this.install = function (host, child) {
    this.toolbar_el.appendChild(this.toolbar_bold);
    this.toolbar_el.appendChild(this.toolbar_italic);
    this.toolbar_el.appendChild(this.toolbar_link);
    this.toolbar_el.appendChild(this.toolbar_image);
    this.toolbar_el.appendChild(this.toolbar_header1);
    this.toolbar_el.appendChild(this.toolbar_header2);
    this.toolbar_el.appendChild(this.toolbar_unorderedList);
    this.toolbar_el.appendChild(this.toolbar_orderedList);
    this.toolbar_el.appendChild(this.toolbar_code);

    this.toolbar_wrapper_el.appendChild(child.el);
    this.toolbar_wrapper_el.appendChild(this.toolbar_el);

    host.appendChild(this.toolbar_wrapper_el);
  };
}