export function Find() {
  this.el = document.createElement("label");
  this.el.innerText = "find: ";
  this.input_el = document.createElement("input");
  this.input_el.classList.add("find-input");
  this.el.appendChild(this.input_el);
  this.search = "";

  this.install = function () {};

  this.input_el.addEventListener("input", (e) => {
    this.search = e.target.value;
    hilite.search(this.search);
  });
}
