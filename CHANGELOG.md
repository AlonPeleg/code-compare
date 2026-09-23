# Change Log

## 1.0.0 — Dev Toolkit
Complete rework of *json-viewer-plus* into **Dev Toolkit**.

- Renamed extension to **Dev Toolkit** (`dev-toolkit`); commands now live under `devToolkit.*`.
- Status bar button opens the toolkit in a split panel next to your editor.
- New **Code** tool: viewer (syntax highlighting, language auto-detect / override, folding, find, word wrap, copy, download, open in editor) and compare.
- New **JSON** tool: tree viewer (collapse / expand, find, hover path + copy path, copy formatted, copy minified, download, open in editor) and compare (list of changed paths, split or unified text diff, sort keys).
- Compare: pick two viewer entries with the **Compare** button, live diff as you type, character-level highlights, swap, sync scroll, copy as unified diff.
- Editor right-click → **Send to Dev Toolkit** (`Ctrl+Alt+D`) — JSON goes to the JSON tab, everything else to the Code tab. **Send to Dev Toolkit Compare** fills panel A then B.
- Explorer right-click → **Send to Dev Toolkit** for whole files.
- Entries survive hiding the panel and reloading the window.
- Removed: XML tree viewer and JSON↔XML conversion (XML now opens in the Code tab with highlighting).
