# Dev Toolkit

Code & JSON viewer and compare, inside VS Code — the in-editor companion of the [Dev Toolkit website](https://alonpeleg.github.io/devtools/).

## Open it

Click **Dev Toolkit** in the status bar (bottom-left) or run **Dev Toolkit: Open Dev Toolkit** from the Command Palette. The panel opens in a split next to your editor.

## Send code from the editor

Select code or JSON → right-click → **Send to Dev Toolkit** (or press `Ctrl+Alt+D` / `Cmd+Alt+D`).

- Valid JSON (including JSON with comments / trailing commas) goes to the **JSON** tab.
- Anything else goes to the **Code** tab, using the file's language.
- Nothing selected? The whole file is sent.
- **Send to Dev Toolkit Compare** puts the selection into Compare panel A, and the next one into B.
- In the Explorer, right-click a file → **Send to Dev Toolkit**.

## Code tab

| Viewer | Compare |
| --- | --- |
| Syntax highlighting with language auto-detect (click the badge to override) | Paste into A and B — the diff updates as you type |
| Fold / unfold blocks, word wrap, find (`Enter` / `Shift+Enter`) | Split or unified view, character-level highlights |
| Copy, download, open in a new editor tab | Ignore whitespace, swap A/B, format, sync scroll |
| Rename entries, collapse cards | Jump between changes, copy as unified diff |

## JSON tab

| Viewer | Compare |
| --- | --- |
| Collapsible tree with item / key counts | **Changes** list: every added, removed and changed path |
| Hover a node to see its path, click the link icon to copy it | **Split** / **Unified** text diff of the formatted JSON |
| Copy formatted, copy minified, download `.json` | **Sort keys** so key order doesn't count as a change |
| Find with auto-expand of collapsed nodes | Format A / B, swap, sync scroll |

**Compare from the viewer:** click **Compare** in the viewer toolbar, then click two entries — they open side by side in the Compare tab.

Drag & drop files onto the paste box (or onto a compare panel) to load them.

## Settings

| Setting | Default | |
| --- | --- | --- |
| `devToolkit.jsonIndent` | `2` | Indentation for formatted / copied / downloaded JSON |
| `devToolkit.showStatusBarButton` | `true` | Show the status bar button |
| `devToolkit.revealOnSend` | `true` | Bring the panel into view when sending |

## Development

```bash
npm install
npm run compile      # or: npm run watch
# F5 in VS Code to launch an Extension Development Host
npx @vscode/vsce package
```

Made by [alonpe](https://github.com/AlonPeleg).
