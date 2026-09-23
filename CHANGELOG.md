# Change Log

<<<<<<< HEAD
## 1.2.0
- Compare: new **Wrap lines** toggle (off by default). Without wrap, long lines scroll sideways — in split view each side scrolls horizontally and stays in sync, with line numbers pinned on the left.

## 1.1.0
- Compare tab now fills the panel height; only the result box scrolls (adapts when the terminal opens/closes).
- New split diff: aligned A | B cells with red / green / yellow change markers and row hover.
- Click any diff line to jump to it in its panel (split: left = A, right = B; unified: − = A, + = B). JSON "Changes" rows jump to the path in A and/or B.
- Viewer: List / Grid layout toggle; grid uses a slightly smaller font.
- Tabs render 4 wide; language badge shows just the language name.

## 1.0.0 — Dev Toolkit
Complete rework of *json-viewer-plus* into **Dev Toolkit**.

=======
## 1.0.0 — Dev Toolkit
Complete rework of *json-viewer-plus* into **Dev Toolkit**.

>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
- Renamed extension to **Dev Toolkit** (`dev-toolkit`); commands now live under `devToolkit.*`.
- Status bar button opens the toolkit in a split panel next to your editor.
- New **Code** tool: viewer (syntax highlighting, language auto-detect / override, folding, find, word wrap, copy, download, open in editor) and compare.
- New **JSON** tool: tree viewer (collapse / expand, find, hover path + copy path, copy formatted, copy minified, download, open in editor) and compare (list of changed paths, split or unified text diff, sort keys).
- Compare: pick two viewer entries with the **Compare** button, live diff as you type, character-level highlights, swap, sync scroll, copy as unified diff.
- Editor right-click → **Send to Dev Toolkit** (`Ctrl+Alt+D`) — JSON goes to the JSON tab, everything else to the Code tab. **Send to Dev Toolkit Compare** fills panel A then B.
- Explorer right-click → **Send to Dev Toolkit** for whole files.
- Entries survive hiding the panel and reloading the window.
- Removed: XML tree viewer and JSON↔XML conversion (XML now opens in the Code tab with highlighting).
