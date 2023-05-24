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

for word referencing (eg. anyword¹), use ^ follow by any number eg. word^1 and type Cmd+Shift+6 (make sure the cursor is within the target word) it will be converted to 'word¹' and append the reference to the end of the file.

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
- Cmd+Shift+; : switch between dark/light theme.

## Inserts
- Cmd+d : 📅 Date 
- Cmd+t : 🕐 Time 
- Cmd+h : Header²
- Cmd+H : Sub-Header²
- Cmd+/ : Comment

View sources: https://github.com/karnpapon/jot

# References
¹ example reference word
² will create marker at navigator
`
  );

  this.disabled = true;

  this.name = function () {
    return "helpers";
  };

  this.has_changes = function () {
    return false;
  };
}
