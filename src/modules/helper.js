import { Page } from "./page.js";

export function Helper() {
  Page.call(
    this,
    `"jot" is a simple writing tool focus on writing, no fancy viewer no image-embed no mind-map, no graph, etc.

# Usages
marker will be created by #, ## or ###.
eg. 
# header marker
## sub-header marker
### marker

for footnote superscript (eg. anyword¹), use ^ follow by any number eg. word^1 and type Cmd+Shift+6 (make sure the cursor is within the target word) it will be converted to 'word¹' and append the reference to the end of the file.

# supported extensions
- .txt
- .md
- .doc
- .docx
- .rft
- .rtf

## Shortcuts
- Cmd+o : 📁 open file
- Cmd+n : 📝 new file
- Cmd+s : 💾 save file
- Cmd+Shift+s : 💾 save as file
- Cmd+f : 🔍 find text
- Cmd+' : 👁 toggle navigator
- Cmd+b : 🌎 open url
- Cmd+[ : ← move to previous marker
- Cmd+] : → move to next marker
- Cmd+Shift+6 : convert to footnote superscript

## Inserts
- Cmd+d : 📅 Date 
- Cmd+t : 🕐 Time 
- Cmd+h : Header¹
- Cmd+H : Sub-Header¹
- Cmd+/ : Comment

¹will create marker at navigator

View sources: https://github.com/karnpapon/jot

`
  );

  this.disabled = true;

  this.name = function () {
    return "Helper";
  };

  this.has_changes = function () {
    return false;
  };
}
