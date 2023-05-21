import { Page } from "./page.js";

export function Helper() {
  Page.call(
    this,
    `Jot is a simple writing tool focus on writing, no fancy viewer no image-embed no mind-map, etc.

# Usages
marker will be created by #, ## or --.

eg. 
# header marker
## sub-header marker
-- comment marker

## Shortcuts
- Cmd+o : open file
- Cmd+n : new file
- Cmd+s : save file
- Cmd+f : find text
- Cmd+' : toggle navigator
- Cmd+b : open url
- Cmd+[ : move to previous marker
- Cmd+] : move to next marker

## Inserts
- Cmd+d : Date
- Cmd+t : Time
- Cmd+p : Path
- Cmd+h : Header [*]
- Cmd+H : Sub-Header [*]
- Cmd+/ : Comment [*]

[*] will create marker at navigator

View sources: https://github.com/karnpapon/jot

`
  );

  this.name = function () {
    return "Helper";
  };

  this.has_changes = function () {
    return false;
  };
}
