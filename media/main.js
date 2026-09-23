/* Dev Toolkit — webview UI.
   Tools: Code and JSON. Each has a Viewer and a Compare sub-tab.
   Depends on core.js (detectLanguage, highlightToLines, annotateBracketColors, computeFoldRanges,
   myersDiff, groupDiff, charDiff, formatCodeLocally, LANGS, LANG_ORDER, escapeHtml). */
(function () {
    'use strict';
    const vscode = acquireVsCodeApi();

    /* ======================= icons ======================= */
    const P = {
        chev: '<path d="M4 6l4 4 4-4"/>',
        copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.2"/><path d="M10.5 5.5V3.7c0-.7-.5-1.2-1.2-1.2H3.7c-.7 0-1.2.5-1.2 1.2v5.6c0 .7.5 1.2 1.2 1.2h1.8"/>',
        min: '<path d="M2.5 5h11M2.5 8h7M2.5 11h11"/><path d="M12 6.5L10.5 8 12 9.5"/>',
        dl: '<path d="M8 2.5v8M4.8 7.5L8 10.7l3.2-3.2M3 13.5h10"/>',
        open: '<path d="M9 2.5h4.5V7M13.5 2.5L7.5 8.5M11.5 9.5v3.2c0 .5-.4.8-.8.8H3.3c-.5 0-.8-.4-.8-.8V5.3c0-.5.4-.8.8-.8h3.2"/>',
        x: '<path d="M4 4l8 8M12 4l-8 8"/>',
        trash: '<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.3c0 .4.4.7.8.7h4.2c.4 0 .8-.3.8-.7l.6-8.3"/>',
        wrap: '<path d="M2.5 4h11M2.5 8h9a2 2 0 010 4H8M2.5 12h3"/><path d="M9.5 10.5L8 12l1.5 1.5"/>',
        up: '<path d="M4 10l4-4 4 4"/>',
        down: '<path d="M4 6l4 4 4-4"/>',
        expand: '<path d="M4 3.5l4 3 4-3M4 9l4 3 4-3"/>',
        collapse: '<path d="M4 7l4-3 4 3M4 12.5l4-3 4 3"/>',
        swap: '<path d="M3 5.5h10M10.5 3L13 5.5 10.5 8M13 10.5H3M5.5 8L3 10.5 5.5 13"/>',
        cols: '<rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M8 2.5v11"/>',
        list: '<path d="M2.5 4h11M2.5 8h11M2.5 12h11"/>',
        format: '<path d="M2.5 3.5h11M5 6.5h8.5M5 9.5h8.5M2.5 12.5h11"/>',
        plus: '<path d="M8 3v10M3 8h10"/>',
        check: '<path d="M3 8.5l3 3 7-7"/>',
        link: '<path d="M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1M9 11.5l-1 1a2.5 2.5 0 01-3.5-3.5l1-1"/>',
<<<<<<< HEAD
        grid: '<rect x="2.5" y="2.5" width="4.5" height="4.5" rx=".6"/><rect x="9" y="2.5" width="4.5" height="4.5" rx=".6"/><rect x="2.5" y="9" width="4.5" height="4.5" rx=".6"/><rect x="9" y="9" width="4.5" height="4.5" rx=".6"/>',
        rows: '<rect x="2.5" y="2.5" width="11" height="4.5" rx=".6"/><rect x="2.5" y="9" width="11" height="4.5" rx=".6"/>',
=======
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
        pick: '<rect x="2" y="2.5" width="5" height="11" rx="1"/><rect x="9" y="2.5" width="5" height="11" rx="1"/>'
    };
    const icon = n => `<svg class="i" viewBox="0 0 16 16">${P[n]}</svg>`;

    /* ======================= helpers ======================= */
    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const uid = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fmtBytes = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(2) + ' MB';
    const lineCount = s => s ? s.split('\n').length : 0;
    const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

    let toastTimer;
    function toast(msg) {
        const t = $('#toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
    }
    function copy(text, label, btn) {
        vscode.postMessage({ type: 'copy', text, label });
        toast(label || 'Copied');
        if (btn) {
            const old = btn.innerHTML;
            btn.innerHTML = icon('check');
            btn.classList.add('ok');
            setTimeout(() => { btn.innerHTML = old; btn.classList.remove('ok'); }, 900);
        }
    }

    /* ---------- JSON helpers ---------- */
    function stripJsonc(text) {
        let out = '', inStr = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i], nx = text[i + 1];
            if (inStr) { out += ch; if (ch === '\\') { out += nx || ''; i++; } else if (ch === '"') inStr = false; continue; }
            if (ch === '"') { inStr = true; out += ch; continue; }
            if (ch === '/' && nx === '/') { while (i < text.length && text[i] !== '\n') i++; out += '\n'; continue; }
            if (ch === '/' && nx === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i++; continue; }
            out += ch;
        }
        return out.replace(/,(\s*[}\]])/g, '$1');
    }
    /** Parses JSON (tolerating comments / trailing commas). Returns {ok, value} or {ok:false, error}. */
    function parseJson(text) {
        const t = String(text || '').trim();
        if (!t) return { ok: false, error: 'Empty input' };
        try { return { ok: true, value: JSON.parse(t) }; }
        catch (e) {
            try { return { ok: true, value: JSON.parse(stripJsonc(t)), lenient: true }; }
            catch (_) { return { ok: false, error: describeJsonError(e, t) }; }
        }
    }
    function describeJsonError(e, text) {
        const msg = String(e && e.message || e);
        const m = /position (\d+)/.exec(msg);
        if (m) {
            const pos = +m[1];
            const before = text.slice(0, pos).split('\n');
            return `${msg.replace(/ in JSON at position \d+.*$/, '')} — line ${before.length}, col ${before[before.length - 1].length + 1}`;
        }
        return msg;
    }
    const jsonIndent = () => state.settings.jsonIndent || 2;
    const prettyJson = v => JSON.stringify(v, null, jsonIndent());
    function sortKeysDeep(v) {
        if (Array.isArray(v)) return v.map(sortKeysDeep);
        if (v && typeof v === 'object') { const o = {}; Object.keys(v).sort().forEach(k => o[k] = sortKeysDeep(v[k])); return o; }
        return v;
    }
    const isIdent = k => /^[A-Za-z_$][\w$]*$/.test(k);
    const childPath = (base, key, isArr) => isArr ? `${base}[${key}]` : isIdent(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`;

    /* ======================= state ======================= */
    const blankSide = () => ({ text: '', name: '', lang: 'auto' });
    const defaults = {
        tool: 'code',
        sub: { code: 'view', json: 'view' },
        entries: { code: [], json: [] },
        compare: {
<<<<<<< HEAD
            code: { a: blankSide(), b: blankSide(), view: 'split', ignoreWs: false, wrap: false },
            json: { a: blankSide(), b: blankSide(), view: 'changes', sortKeys: true, wrap: false }
        },
        layout: { code: 'list', json: 'list' },
=======
            code: { a: blankSide(), b: blankSide(), view: 'split', ignoreWs: false },
            json: { a: blankSide(), b: blankSide(), view: 'changes', sortKeys: true }
        },
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
        syncScroll: true,
        settings: { jsonIndent: 2 }
    };
    const saved = vscode.getState();
    const state = Object.assign({}, defaults, saved || {});
    state.sub = Object.assign({}, defaults.sub, state.sub);
    state.entries = Object.assign({ code: [], json: [] }, state.entries);
    state.compare = {
        code: Object.assign({}, defaults.compare.code, state.compare && state.compare.code),
        json: Object.assign({}, defaults.compare.json, state.compare && state.compare.json)
    };
    state.settings = Object.assign({}, defaults.settings, state.settings);
<<<<<<< HEAD
    state.layout = Object.assign({}, defaults.layout, state.layout);
=======
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
    const persist = debounce(() => vscode.setState(state), 250);

    // UI-only state (not persisted)
    const folds = {};          // entryId -> Set(collapsed fold start lines)
    const finds = {};          // entryId -> { marks, idx }
    let picking = null;        // { tool, first: id|null }
    const expandedGaps = { code: new Set(), json: new Set() };
    let lastDiff = { code: null, json: null };

    /* ======================= layout ======================= */
    const TOOL_LABEL = { code: 'Code', json: 'JSON' };
    $('#app').innerHTML = `
        <header class="topbar">
            <div class="brand">Dev Toolkit<span class="cursor">_</span></div>
            <button class="tool-tab" data-act="tool" data-tool="code"><span class="dot code"></span>Code<span class="long">&nbsp;Viewer &amp; Compare</span></button>
            <button class="tool-tab" data-act="tool" data-tool="json"><span class="dot json"></span>JSON<span class="long">&nbsp;Viewer &amp; Compare</span></button>
            <div class="spacer"></div>
        </header>
        <nav class="subbar">
            <button class="sub-tab" data-act="sub" data-sub="view">Viewer <span class="count" id="count"></span></button>
            <button class="sub-tab" data-act="sub" data-sub="compare">Compare</button>
        </nav>
        ${['code', 'json'].map(t => viewerPaneHtml(t) + comparePaneHtml(t)).join('')}
    `;

    function viewerPaneHtml(t) {
        const isCode = t === 'code';
        return `
        <section class="pane" id="pane-${t}-view" data-tool="${t}">
            <div class="pane-head">
                <h2>${TOOL_LABEL[t]} Viewer</h2>
                <span class="hint">${isCode ? 'paste code — language is detected automatically' : 'paste JSON to explore it as a tree'}</span>
                <div class="spacer"></div>
                <button class="btn secondary" data-act="pick" title="Pick two snippets to compare">${icon('pick')} Compare</button>
<<<<<<< HEAD
                <div class="seg icons" title="Layout">
                    <button data-act="layout" data-layout="list" title="List view">${icon('rows')}</button>
                    <button data-act="layout" data-layout="grid" title="Grid view">${icon('grid')}</button>
                </div>
=======
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
                <button class="ib" data-act="collapse-all-cards" title="Collapse all">${icon('collapse')}</button>
                <button class="ib" data-act="expand-all-cards" title="Expand all">${icon('expand')}</button>
                <button class="ib danger" data-act="clear-all" title="Clear all">${icon('trash')}</button>
            </div>
            <div class="pick-banner hidden">Click two ${isCode ? 'snippets' : 'entries'} to compare — <span class="kbd">Esc</span> to cancel</div>
            <div class="composer">
                <textarea class="composer-input" spellcheck="false" placeholder="${isCode
                    ? 'Paste any code here (TypeScript, JavaScript, Java, Python, C#, Go, SQL, XML, YAML…) or drop a file. Ctrl+Enter to add.'
                    : 'Paste JSON here or drop a .json file. Ctrl+Enter to add.'}"></textarea>
                <div class="row">
                    ${isCode ? `<select class="composer-lang" title="Language">${langOptions('auto')}</select>` : ''}
                    <span class="hint">Tip: select text in the editor → right-click → <b>Send to Dev Toolkit</b></span>
                    <button class="btn" data-act="add">${icon('plus')} Add</button>
                    <div class="err"></div>
                </div>
            </div>
            <div class="entries"></div>
            <div class="empty">No ${isCode ? 'snippets' : 'JSON entries'} yet.<br>Paste above, or select ${isCode ? 'code' : 'JSON'} in the editor and press <kbd>Ctrl+Alt+D</kbd> / right-click → <b>Send to Dev Toolkit</b>.</div>
        </section>`;
    }

    function comparePaneHtml(t) {
        const isCode = t === 'code';
        const side = s => `
            <div class="cmp-col" data-side="${s}">
                <div class="card-head">
                    <span class="plabel">${s.toUpperCase()}</span>
                    <input type="text" class="name" data-field="name" placeholder="${s === 'a' ? 'Original' : 'Modified'}" spellcheck="false">
                    ${isCode ? `<select class="badge side-lang" data-field="lang" title="Language (used for Format)"></select>` : ''}
                    <div class="actions">
                        <button class="ib" data-act="side-format" title="${isCode ? 'Format' : 'Format JSON'}">${icon('format')}</button>
                        <button class="ib" data-act="side-copy" title="Copy">${icon('copy')}</button>
                        <button class="ib danger" data-act="side-clear" title="Clear">${icon('x')}</button>
                    </div>
                </div>
                <textarea spellcheck="false" wrap="off" data-field="text" placeholder="Paste ${s === 'a' ? 'the original' : 'the modified'} ${isCode ? 'code' : 'JSON'} here…"></textarea>
                <div class="err"></div>
                <div class="foot"></div>
            </div>`;
        return `
        <section class="pane" id="pane-${t}-compare" data-tool="${t}">
            <div class="pane-head">
                <h2>Compare ${TOOL_LABEL[t]}</h2>
                <span class="hint">A vs B</span>
                <div class="spacer"></div>
                <label class="check" title="Scroll both inputs together"><input type="checkbox" data-act="sync"> Sync scroll</label>
                <button class="ib" data-act="swap" title="Swap A and B">${icon('swap')}</button>
                <button class="ib danger" data-act="cmp-clear" title="Clear both">${icon('trash')}</button>
            </div>
            <div class="cmp-grid">${side('a')}${side('b')}</div>
            <div class="res-head">
                <h3>Result</h3>
                <div class="seg" data-group="view">
                    ${isCode ? '' : `<button data-act="view" data-view="changes" title="List of changed paths">${icon('list')} Changes</button>`}
                    <button data-act="view" data-view="split" title="Side by side">${icon('cols')} Split</button>
                    <button data-act="view" data-view="unified" title="Unified">${icon('list')} Unified</button>
                </div>
                ${isCode
                    ? `<label class="check"><input type="checkbox" data-act="opt" data-opt="ignoreWs"> Ignore whitespace</label>`
                    : `<label class="check" title="Ignore key order when comparing text"><input type="checkbox" data-act="opt" data-opt="sortKeys"> Sort keys</label>`}
<<<<<<< HEAD
                <label class="check" title="Wrap long lines instead of scrolling sideways"><input type="checkbox" data-act="opt" data-opt="wrap"> Wrap lines</label>
=======
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
                <div class="spacer"></div>
                <button class="btn" data-act="run-compare">${icon('cols')} Compare</button>
            </div>
            <div class="results"><div class="res-msg">Paste something into both A and B — the result updates as you type.</div></div>
        </section>`;
    }

    function langOptions(selected, detectedLabel) {
<<<<<<< HEAD
        let html = `<option value="auto"${selected === 'auto' ? ' selected' : ''}>${detectedLabel ? esc(detectedLabel) : 'Auto-detect'}</option>`;
=======
        let html = `<option value="auto"${selected === 'auto' ? ' selected' : ''}>${detectedLabel ? 'Auto: ' + esc(detectedLabel) : 'Auto-detect'}</option>`;
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
        LANG_ORDER.forEach(id => { html += `<option value="${id}"${selected === id ? ' selected' : ''}>${LANGS[id].label}</option>`; });
        return html;
    }

<<<<<<< HEAD
    function applyLayout(tool) {
        const pane = $(`#pane-${tool}-view`);
        const grid = state.layout[tool] === 'grid';
        $('.entries', pane).classList.toggle('grid', grid);
        $$('[data-act="layout"]', pane).forEach(b => b.classList.toggle('active', b.dataset.layout === state.layout[tool]));
    }

=======
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
    /* ======================= navigation ======================= */
    function applyNav() {
        $$('.tool-tab').forEach(b => b.classList.toggle('active', b.dataset.tool === state.tool));
        const sub = state.sub[state.tool];
        $$('.sub-tab').forEach(b => b.classList.toggle('active', b.dataset.sub === sub));
        $$('.pane').forEach(p => p.classList.toggle('active', p.id === `pane-${state.tool}-${sub}`));
        $('#count').textContent = state.entries[state.tool].length || '';
        if (picking && (picking.tool !== state.tool || sub !== 'view')) stopPicking();
        persist();
    }
    function go(tool, sub) {
        state.tool = tool;
        if (sub) state.sub[tool] = sub;
        applyNav();
    }

    /* ======================= viewer: entries ======================= */
    function effLang(e) { return e.lang && e.lang !== 'auto' ? e.lang : e.detected; }

    function addEntry(tool, content, opts) {
        opts = opts || {};
        const pane = $(`#pane-${tool}-view`);
        const errEl = $('.composer .err', pane);
        errEl.textContent = '';
        if (!content || !content.trim()) return false;
        let e;
        if (tool === 'json') {
            const r = parseJson(content);
            if (!r.ok) { errEl.textContent = 'Invalid JSON: ' + r.error; go('json', 'view'); return false; }
            if (r.lenient) toast('Comments / trailing commas were removed');
            e = { id: uid(), name: opts.name || '', content: JSON.stringify(r.value), time: timeNow(), collapsed: false };
        } else {
            const detected = detectLanguage(content, opts.fileName || null).id;
            e = { id: uid(), name: opts.name || '', content: content.replace(/\r\n?/g, '\n'), lang: opts.lang || 'auto', detected, time: timeNow(), collapsed: false, wrap: false };
        }
        state.entries[tool].unshift(e);
        const card = renderCard(tool, e);
        $('.entries', pane).prepend(card);
        card.classList.add('flash');
        setTimeout(() => card.classList.remove('flash'), 1200);
        updateEmpty(tool);
        persist();
        return true;
    }

    function updateEmpty(tool) {
        const pane = $(`#pane-${tool}-view`);
        $('.empty', pane).classList.toggle('hidden', state.entries[tool].length > 0);
        if (tool === state.tool) $('#count').textContent = state.entries[tool].length || '';
    }

    function findEntry(tool, id) { return state.entries[tool].find(e => e.id === id); }

    function renderCard(tool, e) {
        const card = document.createElement('div');
        card.className = 'card' + (e.collapsed ? ' collapsed' : '');
        card.dataset.id = e.id;
        card.dataset.tool = tool;
        if (tool === 'code') {
            const L = LANGS[effLang(e)] || LANGS.plaintext;
            card.innerHTML = `
                <div class="card-head">
                    <button class="ib chev" data-act="toggle-card" title="Collapse / expand">${icon('chev')}</button>
                    <input type="text" class="name" value="${esc(e.name)}" placeholder="Untitled" spellcheck="false" data-act="rename">
                    <select class="badge ${L.dark ? 'dark-text' : ''}" style="background:${L.color}" data-act="lang" title="Language — click to override">${langOptions(e.lang || 'auto', LANGS[e.detected] ? LANGS[e.detected].label : '')}</select>
                    <span class="meta">${lineCount(e.content)} lines · ${e.content.length} chars · ${esc(e.time)}</span>
                    <div class="actions">
                        <button class="ib ${e.wrap ? 'on' : ''}" data-act="wrap" title="Word wrap">${icon('wrap')}</button>
                        <button class="ib" data-act="copy" title="Copy">${icon('copy')}</button>
                        <button class="ib" data-act="download" title="Download">${icon('dl')}</button>
                        <button class="ib" data-act="open" title="Open in editor">${icon('open')}</button>
                        <button class="ib danger" data-act="delete" title="Remove">${icon('x')}</button>
                    </div>
                </div>
                <div class="card-tools">
                    ${findHtml()}
                    <div class="right">
                        <button class="ib" data-act="fold-all" title="Fold all">${icon('collapse')}</button>
                        <button class="ib" data-act="unfold-all" title="Unfold all">${icon('expand')}</button>
                    </div>
                </div>
                <div class="card-body"></div>`;
            renderCodeBody(card, e);
        } else {
            const v = JSON.parse(e.content);
            const kind = Array.isArray(v) ? `array · ${v.length} items` : (v && typeof v === 'object') ? `object · ${Object.keys(v).length} keys` : typeof v;
            card.innerHTML = `
                <div class="card-head">
                    <button class="ib chev" data-act="toggle-card" title="Collapse / expand">${icon('chev')}</button>
                    <span class="badge static dark-text" style="background:var(--json-accent)">JSON</span>
                    <input type="text" class="name" value="${esc(e.name)}" placeholder="Untitled" spellcheck="false" data-act="rename">
                    <span class="meta">${kind} · ${fmtBytes(new Blob([e.content]).size)} · ${esc(e.time)}</span>
                    <div class="actions">
                        <button class="ib" data-act="copy" title="Copy (formatted)">${icon('copy')}</button>
                        <button class="ib" data-act="copy-min" title="Copy minified">${icon('min')}</button>
                        <button class="ib" data-act="download" title="Download .json">${icon('dl')}</button>
                        <button class="ib" data-act="open" title="Open in editor">${icon('open')}</button>
                        <button class="ib danger" data-act="delete" title="Remove">${icon('x')}</button>
                    </div>
                </div>
                <div class="card-tools">
                    ${findHtml()}
                    <span class="crumb" title="Path of the hovered / selected node">$</span>
                    <div class="right">
                        <button class="ib" data-act="copy-path" title="Copy path">${icon('link')}</button>
                        <button class="ib" data-act="tree-collapse" title="Collapse all nodes">${icon('collapse')}</button>
                        <button class="ib" data-act="tree-expand" title="Expand all nodes">${icon('expand')}</button>
                    </div>
                </div>
                <div class="card-body"></div>`;
            renderJsonBody(card, v);
        }
        return card;
    }

    function findHtml() {
        return `<div class="find">
            <input type="text" data-act="find" placeholder="Find…" spellcheck="false">
            <span class="ctr">0/0</span>
            <button class="ib" data-act="find-prev" title="Previous (Shift+Enter)">${icon('up')}</button>
            <button class="ib" data-act="find-next" title="Next (Enter)">${icon('down')}</button>
        </div>`;
    }

    /* ---------- code rendering ---------- */
    function renderCodeBody(card, e) {
        const lang = effLang(e);
        const raw = e.content.split('\n');
        const lines = annotateBracketColors(highlightToLines(e.content, lang));
        const ranges = raw.length > 5000 ? [] : computeFoldRanges(e.content, lang);
        const byStart = new Map(ranges.map(r => [r.start, r]));
        const parents = raw.map(() => []);
        ranges.forEach(r => { for (let i = r.start + 1; i <= r.end && i < raw.length; i++) parents[i].push(r.start); });
        const collapsed = folds[e.id] || (folds[e.id] = new Set());
        let html = `<div class="code${e.wrap ? ' wrap' : ''}">`;
        lines.forEach((toks, i) => {
            const fr = byStart.get(i);
            const isF = fr && collapsed.has(i);
            const hidden = parents[i].some(p => collapsed.has(p));
            html += `<div class="cl" data-l="${i}"${parents[i].length ? ` data-p="${parents[i].join(',')}"` : ''}${hidden ? ' style="display:none"' : ''}>`;
            html += `<span class="ln">${fr ? `<span class="fold${isF ? ' folded' : ''}" data-act="fold" data-l="${i}">${isF ? '▸' : '▾'}</span>` : ''}${i + 1}</span><span class="ct">`;
            html += toks.length ? toks.map(t => t.cls ? `<span class="${t.cls}">${escapeHtml(t.text)}</span>` : escapeHtml(t.text)).join('') : ' ';
            if (fr) html += `<span class="fold-ph" data-act="fold" data-l="${i}" style="display:${isF ? 'inline' : 'none'}">⋯ ${fr.end - fr.start} lines</span>`;
            html += '</span></div>';
        });
        $('.card-body', card).innerHTML = html + '</div>';
        resetFind(card);
    }

    function applyFolds(card) {
        const set = folds[card.dataset.id] || new Set();
        $$('.cl', card).forEach(l => {
            const p = l.dataset.p ? l.dataset.p.split(',') : [];
            l.style.display = p.some(x => set.has(+x)) ? 'none' : '';
        });
        $$('.fold', card).forEach(f => { const on = set.has(+f.dataset.l); f.textContent = on ? '▸' : '▾'; f.classList.toggle('folded', on); });
        $$('.fold-ph', card).forEach(f => f.style.display = set.has(+f.dataset.l) ? 'inline' : 'none');
    }

    /* ---------- JSON tree rendering ---------- */
    function renderJsonBody(card, value) {
        const body = $('.card-body', card);
        body.innerHTML = '';
        const tree = document.createElement('div');
        tree.className = 'tree';
        let count = 0;
        const big = (function countNodes(v) { if (v && typeof v === 'object') { count++; if (count > 3000) return true; for (const k in v) if (countNodes(v[k])) return true; } return false; })(value);
        tree.appendChild(jsonNode(value, null, '$', true, 0, big ? 2 : Infinity));
        body.appendChild(tree);
        resetFind(card);
    }

    function jsonScalar(v) {
        const s = document.createElement('span');
        if (v === null) { s.className = 'jnull'; s.textContent = 'null'; }
        else if (typeof v === 'string') { s.className = 'js'; s.textContent = JSON.stringify(v); }
        else if (typeof v === 'number') { s.className = 'jnum'; s.textContent = String(v); }
        else { s.className = 'jb'; s.textContent = String(v); }
        return s;
    }

    function jsonNode(v, key, path, isLast, depth, openDepth) {
        const node = document.createElement('div');
        node.className = 'jn';
        node.dataset.path = path;
        const line = document.createElement('div');
        line.className = 'jl';
        const tog = document.createElement('span');
        tog.className = 'jt';
        line.appendChild(tog);
        if (key !== null) {
            const k = document.createElement('span');
            if (typeof key === 'number') { k.className = 'jidx'; k.textContent = key + ': '; }
            else { k.className = 'jk'; k.textContent = JSON.stringify(key); line.appendChild(k); const c = document.createElement('span'); c.className = 'jp'; c.textContent = ': '; line.appendChild(c); }
            if (typeof key === 'number') line.appendChild(k);
        }
        const comma = isLast ? '' : ',';
        if (v !== null && typeof v === 'object') {
            const arr = Array.isArray(v);
            const keys = arr ? v.map((_, i) => i) : Object.keys(v);
            const open = arr ? '[' : '{', close = arr ? ']' : '}';
            if (!keys.length) {
                line.appendChild(Object.assign(document.createElement('span'), { className: 'jp', textContent: open + close + comma }));
                node.appendChild(line);
                return node;
            }
            tog.textContent = '▼';
            tog.dataset.act = 'jtoggle';
            line.appendChild(Object.assign(document.createElement('span'), { className: 'jp', textContent: open }));
            const sum = document.createElement('span');
            sum.className = 'jsum';
            sum.dataset.act = 'jtoggle';
            sum.innerHTML = `…${close}${comma}<span class="n">${keys.length} ${arr ? 'items' : 'keys'}</span>`;
            line.appendChild(sum);
            node.appendChild(line);
            const kids = document.createElement('div');
            kids.className = 'jkids';
            keys.forEach((k, i) => kids.appendChild(jsonNode(v[k], k, childPath(path, k, arr), i === keys.length - 1, depth + 1, openDepth)));
            node.appendChild(kids);
            const cl = document.createElement('div');
            cl.className = 'jclose jp';
            cl.textContent = close + comma;
            node.appendChild(cl);
            if (depth >= openDepth) { node.classList.add('closed'); tog.textContent = '▶'; }
        } else {
            line.appendChild(jsonScalar(v));
            if (comma) line.appendChild(Object.assign(document.createElement('span'), { className: 'jp', textContent: comma }));
            node.appendChild(line);
        }
        return node;
    }
    function setJsonNodeOpen(node, open) {
        node.classList.toggle('closed', !open);
        const t = $(':scope > .jl > .jt', node);
        if (t && t.textContent) t.textContent = open ? '▼' : '▶';
    }

    /* ---------- find (per card) ---------- */
    function resetFind(card) {
        const input = $('[data-act="find"]', card);
        finds[card.dataset.id] = { marks: [], idx: -1 };
        if (input && input.value) runFind(card, input.value);
        else if (input) $('.ctr', card).textContent = '0/0';
    }
    function clearMarks(card) {
        $$('mark.m', card).forEach(m => { const p = m.parentNode; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); });
    }
    function runFind(card, q) {
        clearMarks(card);
        const st = finds[card.dataset.id] = { marks: [], idx: -1 };
        const ctr = $('.ctr', card);
        q = q.toLowerCase();
        if (!q) { ctr.textContent = '0/0'; return; }
        const root = $('.card-body', card);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: n => n.parentElement.closest('.ln, .fold-ph, .jsum, .jt') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
        });
        const nodes = [];
        let n;
        while ((n = walker.nextNode())) nodes.push(n);
        nodes.forEach(node => {
            let text = node.nodeValue, lower = text.toLowerCase(), idx;
            while ((idx = lower.indexOf(q)) !== -1) {
                const after = node.splitText(idx);
                const rest = after.splitText(q.length);
                const mark = document.createElement('mark');
                mark.className = 'm';
                mark.textContent = after.nodeValue;
                after.parentNode.replaceChild(mark, after);
                st.marks.push(mark);
                node = rest; text = node.nodeValue; lower = text.toLowerCase();
            }
        });
        if (st.marks.length) { st.idx = 0; showMatch(card); }
        else ctr.textContent = '0/0';
    }
    function stepFind(card, dir) {
        const st = finds[card.dataset.id];
        if (!st || !st.marks.length) return;
        st.idx = (st.idx + dir + st.marks.length) % st.marks.length;
        showMatch(card);
    }
    function showMatch(card) {
        const st = finds[card.dataset.id];
        st.marks.forEach(m => m.classList.remove('cur'));
        const m = st.marks[st.idx];
        m.classList.add('cur');
        // reveal: unfold code folds / open JSON nodes that hide the match
        if (card.dataset.tool === 'code') {
            const line = m.closest('.cl');
            if (line && line.dataset.p) {
                const set = folds[card.dataset.id];
                line.dataset.p.split(',').forEach(p => set.delete(+p));
                applyFolds(card);
            }
        } else {
            let p = m.closest('.jn.closed');
            while (p) { setJsonNodeOpen(p, true); p = p.parentElement.closest('.jn.closed'); }
        }
        m.scrollIntoView({ block: 'center', inline: 'nearest' });
        $('.ctr', card).textContent = `${st.idx + 1}/${st.marks.length}`;
    }

    /* ---------- pick two entries → compare ---------- */
    function startPicking(tool) {
        picking = { tool, first: null };
        const pane = $(`#pane-${tool}-view`);
        pane.classList.add('picking');
        $('.pick-banner', pane).classList.remove('hidden');
        $('[data-act="pick"]', pane).classList.add('on');
        $('[data-act="pick"]', pane).classList.remove('secondary');
    }
    function stopPicking() {
        if (!picking) return;
        const pane = $(`#pane-${picking.tool}-view`);
        pane.classList.remove('picking');
        $('.pick-banner', pane).classList.add('hidden');
        $('[data-act="pick"]', pane).classList.remove('on');
        $('[data-act="pick"]', pane).classList.add('secondary');
        $$('.card.picked', pane).forEach(c => c.classList.remove('picked'));
        picking = null;
    }
    function pickCard(card) {
        const tool = picking.tool;
        if (!picking.first) { picking.first = card.dataset.id; card.classList.add('picked'); return; }
        if (picking.first === card.dataset.id) { picking.first = null; card.classList.remove('picked'); return; }
        const a = findEntry(tool, picking.first), b = findEntry(tool, card.dataset.id);
        stopPicking();
        loadSide(tool, 'a', entryToSide(tool, a));
        loadSide(tool, 'b', entryToSide(tool, b));
        go(tool, 'compare');
        runCompare(tool);
    }
    function entryToSide(tool, e) {
        if (tool === 'json') return { text: prettyJson(JSON.parse(e.content)), name: e.name || '', lang: 'auto' };
        return { text: e.content, name: e.name || '', lang: e.lang && e.lang !== 'auto' ? e.lang : e.detected };
    }

    /* ======================= compare ======================= */
    function cmpPane(tool) { return $(`#pane-${tool}-compare`); }
    function sideEl(tool, s) { return $(`.cmp-col[data-side="${s}"]`, cmpPane(tool)); }

    function syncCompareInputs(tool) {
        const c = state.compare[tool];
        ['a', 'b'].forEach(s => {
            const col = sideEl(tool, s);
            $('[data-field="text"]', col).value = c[s].text;
            $('[data-field="name"]', col).value = c[s].name;
            const sel = $('[data-field="lang"]', col);
            if (sel) updateSideLang(tool, s);
            updateSideFoot(tool, s);
        });
        const pane = cmpPane(tool);
        $$('[data-act="view"]', pane).forEach(b => b.classList.toggle('active', b.dataset.view === c.view));
        $$('[data-act="opt"]', pane).forEach(i => i.checked = !!c[i.dataset.opt]);
        $('[data-act="sync"]', pane).checked = !!state.syncScroll;
    }
    function updateSideLang(tool, s) {
        const sel = $('[data-field="lang"]', sideEl(tool, s));
        if (!sel) return;
        const side = state.compare[tool][s];
        const detected = side.text.trim() ? detectLanguage(side.text).id : null;
        const eff = side.lang && side.lang !== 'auto' ? side.lang : (detected || 'plaintext');
        const L = LANGS[eff] || LANGS.plaintext;
        sel.innerHTML = langOptions(side.lang || 'auto', detected ? LANGS[detected].label : '');
        sel.style.background = L.color;
        sel.classList.toggle('dark-text', !!L.dark);
    }
    function updateSideFoot(tool, s) {
        const col = sideEl(tool, s);
        const text = state.compare[tool][s].text;
        $('.foot', col).textContent = text ? `${lineCount(text)} lines · ${text.length} chars` : '';
        const err = $('.err', col);
        err.textContent = '';
        if (tool === 'json' && text.trim()) {
            const r = parseJson(text);
            if (!r.ok) err.textContent = r.error;
        }
    }
    function loadSide(tool, s, data) {
        Object.assign(state.compare[tool][s], data);
        syncCompareInputs(tool);
        persist();
    }

    const langRefresh = { a: debounce(updateSideLang, 400), b: debounce(updateSideLang, 400) };
    const liveCompare = { code: debounce(() => runCompare('code'), 350), json: debounce(() => runCompare('json'), 350) };

    function runCompare(tool) {
        const res = $('.results', cmpPane(tool));
        const c = state.compare[tool];
        if (!c.a.text.trim() || !c.b.text.trim()) {
            res.innerHTML = '<div class="res-msg">Paste something into both A and B — the result updates as you type.</div>';
            lastDiff[tool] = null;
            return;
        }
        let textA = c.a.text.replace(/\r\n?/g, '\n'), textB = c.b.text.replace(/\r\n?/g, '\n');
        let structural = null;
        if (tool === 'json') {
            const ra = parseJson(textA), rb = parseJson(textB);
            if (!ra.ok || !rb.ok) {
                res.innerHTML = `<div class="res-msg bad">Invalid JSON in ${!ra.ok ? 'A' : 'B'}${!ra.ok && !rb.ok ? ' and B' : ''} — fix it to see the comparison.</div>`;
                return;
            }
            let va = ra.value, vb = rb.value;
            structural = jsonDiff(va, vb, '$');
            if (c.sortKeys) { va = sortKeysDeep(va); vb = sortKeysDeep(vb); }
            textA = prettyJson(va); textB = prettyJson(vb);
        }
        const d = lineDiff(textA, textB, tool === 'code' && c.ignoreWs);
        if (d.tooBig) { res.innerHTML = '<div class="res-msg bad">These inputs are too different / too large to diff here. Try smaller pieces.</div>'; return; }
        lastDiff[tool] = { d, structural };
        expandedGaps[tool].clear();
        renderResults(tool);
    }

    /** Line diff with common prefix/suffix trimming. Returns rows: {t:'eq'|'chg'|'del'|'add', a, b, ai, bi} */
    function lineDiff(textA, textB, ignoreWs) {
        const A = textA.split('\n'), B = textB.split('\n');
        const key = ignoreWs ? (s => s.trim().replace(/\s+/g, ' ')) : (s => s);
        const ka = A.map(key), kb = B.map(key);
        let pre = 0;
        while (pre < ka.length && pre < kb.length && ka[pre] === kb[pre]) pre++;
        let suf = 0;
        while (suf < ka.length - pre && suf < kb.length - pre && ka[ka.length - 1 - suf] === kb[kb.length - 1 - suf]) suf++;
        const midA = ka.slice(pre, ka.length - suf), midB = kb.slice(pre, kb.length - suf);
        if ((midA.length + 1) * (midB.length + 1) > 4e7 && midA.length + midB.length > 20000) return { tooBig: true };
        const rows = [];
        for (let i = 0; i < pre; i++) rows.push({ t: 'eq', ai: i, bi: i });
        groupDiff(myersDiff(midA, midB)).forEach(g => {
            if (g.type === 'equal') rows.push({ t: 'eq', ai: g.aIdx + pre, bi: g.bIdx + pre });
            else if (g.type === 'changed') rows.push({ t: 'chg', ai: g.removeOp.aIdx + pre, bi: g.addOp.bIdx + pre });
            else if (g.type === 'remove') rows.push({ t: 'del', ai: g.aIdx + pre });
            else rows.push({ t: 'add', bi: g.bIdx + pre });
        });
        for (let i = suf; i > 0; i--) rows.push({ t: 'eq', ai: A.length - i, bi: B.length - i });
        // In ignore-whitespace mode, lines whose keys match but text differs are shown as equal.
        const stats = { add: 0, del: 0, chg: 0, eq: 0 };
        rows.forEach(r => stats[r.t]++);
        const total = Math.max(A.length, B.length) || 1;
        stats.similarity = Math.round((stats.eq / total) * 100);
        return { rows, A, B, stats };
    }

    const CONTEXT = 3;
    function renderResults(tool) {
        const res = $('.results', cmpPane(tool));
        const { d, structural } = lastDiff[tool];
        const view = state.compare[tool].view;
        const s = d.stats;
        const identical = !s.add && !s.del && !s.chg;
        const changeRows = d.rows.filter(r => r.t !== 'eq').length;
        const isChanges = tool === 'json' && view === 'changes' && structural;
        const cnt = t => structural.filter(x => x.type === t).length;
        let html = isChanges ? `<div class="stats">
            <span><b>${structural.length}</b> difference${structural.length === 1 ? '' : 's'}</span>
            <span class="add"><b>+${cnt('added')}</b> added</span>
            <span class="del"><b>−${cnt('removed')}</b> removed</span>
            <span class="chg"><b>~${cnt('changed') + cnt('type')}</b> changed</span>
            <span class="spacer"></span>
            <button class="ib" data-act="copy-diff" title="Copy as unified diff">${icon('copy')}</button>
        </div>` : `<div class="stats">
            <span><b>${s.similarity}%</b> similar</span>
            <span class="add"><b>+${s.add}</b> added</span>
            <span class="del"><b>−${s.del}</b> removed</span>
            <span class="chg"><b>~${s.chg}</b> changed</span>
            <span class="same"><b>${s.eq}</b> unchanged</span>
            <span class="spacer"></span>
            ${changeRows && view !== 'changes' ? `<button class="ib" data-act="prev-change" title="Previous change">${icon('up')}</button><button class="ib" data-act="next-change" title="Next change">${icon('down')}</button>` : ''}
            <button class="ib" data-act="copy-diff" title="Copy as unified diff">${icon('copy')}</button>
        </div>`;
        if (tool === 'json' && structural && !structural.length) {
            html += `<div class="res-msg ok">✓ The two JSON documents are equivalent${identical ? '' : ' (only key order / formatting differ)'}.</div>`;
            res.innerHTML = html;
            return;
        }
        if (identical) { res.innerHTML = html + '<div class="res-msg ok">✓ No differences.</div>'; return; }
        if (tool === 'json' && view === 'changes') {
            html += '<div class="changes">' + structural.map(ch => changeRowHtml(ch)).join('') + '</div>';
            res.innerHTML = html;
            return;
        }
<<<<<<< HEAD
        const wrap = !!state.compare[tool].wrap;
        html += `<div class="diff ${view} ${wrap ? 'wrap' : 'nowrap'}">${diffRowsHtml(tool, d, view, wrap)}</div>`;
=======
        html += `<div class="diff ${view}">${diffRowsHtml(tool, d, view)}</div>`;
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
        res.innerHTML = html;
        changeCursor[tool] = -1;
    }

    function inlineDiff(a, b) {
        const parts = charDiff(a, b);
        if (!parts) return null;
        let ha = '', hb = '';
        parts.forEach(p => {
            const t = escapeHtml(p.text);
            if (p.type === 'equal') { ha += t; hb += t; }
            else if (p.type === 'remove') ha += `<del>${t}</del>`;
            else hb += `<ins>${t}</ins>`;
        });
        return [ha, hb];
    }

<<<<<<< HEAD
    function diffRowsHtml(tool, d, view, wrap) {
=======
    function diffRowsHtml(tool, d, view) {
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
        const { rows, A, B } = d;
        // collapse long runs of unchanged lines, keeping CONTEXT lines around changes
        const keep = new Array(rows.length).fill(false);
        rows.forEach((r, i) => { if (r.t !== 'eq') for (let k = Math.max(0, i - CONTEXT); k <= Math.min(rows.length - 1, i + CONTEXT); k++) keep[k] = true; });
<<<<<<< HEAD
        let out = '', outA = '', outB = '', i = 0, changeIdx = 0;
        const go = (side, idx) => idx != null ? ` data-go="${side}:${idx}"` : '';
=======
        let out = '', i = 0, changeIdx = 0;
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
        while (i < rows.length) {
            if (!keep[i] && !expandedGaps[tool].has(i)) {
                let j = i;
                while (j < rows.length && !keep[j]) j++;
                if (j - i <= 2) { for (let k = i; k < j; k++) expandedGaps[tool].add(k); continue; }
<<<<<<< HEAD
                const gap = `<div class="gap" data-act="expand-gap" data-from="${i}" data-to="${j}"><span class="gt">⋯ ${j - i} unchanged lines — click to show</span></div>`;
                out += gap; outA += gap; outB += gap;
=======
                out += `<div class="gap" data-act="expand-gap" data-from="${i}" data-to="${j}">⋯ ${j - i} unchanged lines — click to show</div>`;
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
                i = j;
                continue;
            }
            const r = rows[i];
            const a = r.ai != null ? A[r.ai] : null, b = r.bi != null ? B[r.bi] : null;
            const na = r.ai != null ? r.ai + 1 : '', nb = r.bi != null ? r.bi + 1 : '';
            const isChange = r.t !== 'eq';
            const cAttr = isChange && (i === 0 || rows[i - 1].t === 'eq') ? ` data-change="${changeIdx++}"` : '';
            let ha = a != null ? escapeHtml(a) : '', hb = b != null ? escapeHtml(b) : '';
            if (r.t === 'chg') { const x = inlineDiff(a, b); if (x) { ha = x[0]; hb = x[1]; } }
            if (view === 'split') {
<<<<<<< HEAD
                const clsA = { eq: 'eq', chg: 'chg', del: 'del', add: 'blank' }[r.t];
                const clsB = { eq: 'eq', chg: 'chg', del: 'blank', add: 'add' }[r.t];
                const cell = (cls, n, h, side, idx, extra) => cls === 'blank'
                    ? `<div class="sc blank" data-r="${i}"></div>`
                    : `<div class="sc ${cls}" data-r="${i}"${go(side, idx)}${extra || ''} title="Go to line ${n} in panel ${side.toUpperCase()}"><span class="ln">${n}</span><span class="tx">${h || ' '}</span></div>`;
                const ca = cell(clsA, na, ha, 'a', r.ai, cAttr), cb = cell(clsB, nb, hb, 'b', r.bi, clsA === 'blank' ? cAttr : '');
                out += ca + cb; outA += ca; outB += cb;
            } else {
                const row = (cls, n1, n2, sg, h, side, idx, extra) =>
                    `<div class="ur ${cls}"${go(side, idx)}${extra || ''} title="Go to line ${(idx || 0) + 1} in panel ${side.toUpperCase()}"><span class="dn">${n1}</span><span class="dn">${n2}</span><span class="sg">${sg}</span><span class="tx">${h || ' '}</span></div>`;
                if (r.t === 'eq') out += row('eq', na, nb, ' ', ha, 'a', r.ai, cAttr);
                if (a != null && r.t !== 'eq') out += row('del', na, '', '−', ha, 'a', r.ai, cAttr);
                if (b != null && r.t !== 'eq') out += row('add', '', nb, '+', hb, 'b', r.bi, a == null ? cAttr : '');
            }
            i++;
        }
        if (view === 'split' && !wrap) {
            return `<div class="scol" data-col="a"><div class="sin">${outA}</div></div><div class="scol" data-col="b"><div class="sin">${outB}</div></div>`;
        }
        if (view === 'unified' && !wrap) return `<div class="sin">${out}</div>`;
        return out;
    }

    /* ---------- click a diff line -> jump to it in panel A / B ---------- */
    function findLineInPanel(panelText, diffLines, idx) {
        const lines = panelText.replace(/\r\n?/g, '\n').split('\n');
        const target = (diffLines[idx] || '').trim();
        if (lines[idx] != null && lines[idx].trim() === target) return idx;
        // JSON compare shows normalized text; find the nearest line with the same content.
        let best = -1, bestDist = Infinity;
        lines.forEach((l, k) => { if (l.trim() === target && Math.abs(k - idx) < bestDist) { best = k; bestDist = Math.abs(k - idx); } });
        if (best >= 0) return best;
        return Math.min(idx, lines.length - 1);
    }
    function gotoPanel(tool, side, line) {
        const col = sideEl(tool, side);
        const ta = $('[data-field="text"]', col);
        const lines = ta.value.split('\n');
        line = Math.max(0, Math.min(line, lines.length - 1));
        let start = 0;
        for (let k = 0; k < line; k++) start += lines[k].length + 1;
        const lh = parseFloat(getComputedStyle(ta).lineHeight) || 18;
        const wasSync = state.syncScroll;
        state.syncScroll = false;               // don't drag the other panel along
        ta.focus({ preventScroll: true });
        ta.setSelectionRange(start, start + lines[line].length);
        ta.scrollTop = Math.max(0, line * lh - ta.clientHeight / 2 + lh);
        ta.scrollLeft = 0;
        requestAnimationFrame(() => { state.syncScroll = wasSync; });
        col.classList.remove('flash'); void col.offsetWidth; col.classList.add('flash');
        col.scrollIntoView({ block: 'nearest' });
    }
    function gotoFromDiff(tool, spec) {
        const [side, idxStr] = spec.split(':');
        const idx = +idxStr;
        const { d } = lastDiff[tool];
        const text = state.compare[tool][side].text;
        gotoPanel(tool, side, findLineInPanel(text, side === 'a' ? d.A : d.B, idx));
    }
    /** JSON "Changes" row -> line of that path in a panel (pretty-prints the panel's value to locate it). */
    function gotoJsonPath(side, path) {
        const r = parseJson(state.compare.json[side].text);
        if (!r.ok) return;
        const lines = [];
        let found = -1;
        (function walk(v, key, p, depth, last) {
            const pad = ' '.repeat(depth * jsonIndent());
            const k = key == null ? '' : typeof key === 'number' ? '' : JSON.stringify(key) + ': ';
            if (p === path) found = lines.length;
            if (v && typeof v === 'object') {
                const arr = Array.isArray(v), keys = arr ? v.map((_, i) => i) : Object.keys(v);
                if (!keys.length) { lines.push(pad + k + (arr ? '[]' : '{}') + (last ? '' : ',')); return; }
                lines.push(pad + k + (arr ? '[' : '{'));
                keys.forEach((kk, i) => walk(v[kk], kk, childPath(p, kk, arr), depth + 1, i === keys.length - 1));
                lines.push(pad + (arr ? ']' : '}') + (last ? '' : ','));
            } else lines.push(pad + k + JSON.stringify(v) + (last ? '' : ','));
        })(r.value, null, '$', 0, true);
        if (found < 0) return;
        gotoPanel('json', side, findLineInPanel(state.compare.json[side].text, lines, found));
    }

=======
                const ca = r.t === 'eq' ? '' : a == null ? 'empty-side' : 'del';
                const cb = r.t === 'eq' ? '' : b == null ? 'empty-side' : 'add';
                out += `<div class="dn ${ca}"${cAttr}>${na}</div><div class="dc ${ca}">${ha}</div><div class="dn b ${cb}">${nb}</div><div class="dc b ${cb}">${hb}</div>`;
            } else {
                if (r.t === 'eq') out += `<div class="dn"${cAttr}>${na}</div><div class="dn">${nb}</div><div class="sg"> </div><div class="dc">${ha}</div>`;
                if (a != null && r.t !== 'eq') out += `<div class="dn del"${cAttr}>${na}</div><div class="dn del"></div><div class="sg del">−</div><div class="dc del">${ha}</div>`;
                if (b != null && r.t !== 'eq') out += `<div class="dn add"${a == null ? cAttr : ''}></div><div class="dn add">${nb}</div><div class="sg add">+</div><div class="dc add">${hb}</div>`;
            }
            i++;
        }
        return out;
    }

>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
    const changeCursor = { code: -1, json: -1 };
    function stepChange(tool, dir) {
        const marks = $$('.diff [data-change]', cmpPane(tool));
        if (!marks.length) return;
        changeCursor[tool] = (changeCursor[tool] + dir + marks.length) % marks.length;
        const el = marks[changeCursor[tool]];
        el.scrollIntoView({ block: 'center' });
        el.classList.remove('hl'); void el.offsetWidth; el.classList.add('hl');
    }

    function unifiedDiffText(tool) {
        const { d } = lastDiff[tool];
        const c = state.compare[tool];
        let out = `--- ${c.a.name || 'A'}\n+++ ${c.b.name || 'B'}\n`;
        d.rows.forEach(r => {
            if (r.t === 'eq') out += ' ' + d.A[r.ai] + '\n';
            if (r.t === 'del' || r.t === 'chg') out += '-' + d.A[r.ai] + '\n';
            if (r.t === 'add' || r.t === 'chg') out += '+' + d.B[r.bi] + '\n';
        });
        return out;
    }

    /* ---------- JSON structural diff ---------- */
    function typeOf(v) { return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; }
    function jsonDiff(a, b, path, out) {
        out = out || [];
        const ta = typeOf(a), tb = typeOf(b);
        if (ta !== tb) { out.push({ type: 'type', path, old: a, val: b }); return out; }
        if (ta === 'object') {
            Object.keys(a).forEach(k => {
                const p = childPath(path, k, false);
                if (!Object.prototype.hasOwnProperty.call(b, k)) out.push({ type: 'removed', path: p, old: a[k] });
                else jsonDiff(a[k], b[k], p, out);
            });
            Object.keys(b).forEach(k => { if (!Object.prototype.hasOwnProperty.call(a, k)) out.push({ type: 'added', path: childPath(path, k, false), val: b[k] }); });
        } else if (ta === 'array') {
            const n = Math.max(a.length, b.length);
            for (let i = 0; i < n; i++) {
                const p = childPath(path, i, true);
                if (i >= b.length) out.push({ type: 'removed', path: p, old: a[i] });
                else if (i >= a.length) out.push({ type: 'added', path: p, val: b[i] });
                else jsonDiff(a[i], b[i], p, out);
            }
        } else if (a !== b) {
            out.push({ type: 'changed', path, old: a, val: b });
        }
        return out;
    }
    function short(v) {
        let s = JSON.stringify(v);
        if (s === undefined) s = String(v);
        return s.length > 140 ? s.slice(0, 137) + '…' : s;
    }
    function changeRowHtml(ch) {
        const ic = { added: '+', removed: '−', changed: '~', type: '~' }[ch.type];
        let v;
        if (ch.type === 'added') v = `<span class="new">${esc(short(ch.val))}</span>`;
        else if (ch.type === 'removed') v = `<span class="old">${esc(short(ch.old))}</span>`;
        else v = `<span class="old">${esc(short(ch.old))}</span><span class="arrow">→</span><span class="new">${esc(short(ch.val))}</span>${ch.type === 'type' ? `<span class="tag">${typeOf(ch.old)} → ${typeOf(ch.val)}</span>` : ''}`;
<<<<<<< HEAD
        return `<div class="chg-row ${ch.type}" data-act="goto-path" data-type="${ch.type}" data-path="${esc(ch.path)}" title="Click to show in ${ch.type === 'added' ? 'B' : ch.type === 'removed' ? 'A' : 'A and B'}"><span class="ic">${ic}</span><span class="p">${esc(ch.path)}</span><span class="v">${v}</span><button class="ib cp" data-act="copy-change-path" data-path="${esc(ch.path)}" title="Copy path">${icon('link')}</button></div>`;
=======
        return `<div class="chg-row ${ch.type}" data-act="copy-change-path" data-path="${esc(ch.path)}" title="Click to copy path"><span class="ic">${ic}</span><span class="p">${esc(ch.path)}</span><span class="v">${v}</span></div>`;
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
    }

    /* ======================= events ======================= */
    document.addEventListener('click', ev => {
        const el = ev.target.closest('[data-act]');
        const card = ev.target.closest('.card');

        // pick mode: a click anywhere on a card (except its controls) selects it
        if (picking && card && card.dataset.tool === picking.tool && !(el && el.closest('.card-head .actions, .card-tools, input, select'))) {
            pickCard(card);
            return;
        }
<<<<<<< HEAD
        const goEl = ev.target.closest('[data-go]');
        if (goEl && !el && !String(window.getSelection() || '')) {
            gotoFromDiff(goEl.closest('.pane').dataset.tool, goEl.dataset.go);
            return;
        }
=======
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
        if (!el) return;
        const act = el.dataset.act;
        const pane = el.closest('.pane');
        const tool = pane ? pane.dataset.tool : state.tool;

        switch (act) {
            case 'tool': go(el.dataset.tool); return;
            case 'sub': go(state.tool, el.dataset.sub); return;
            case 'add': {
                const ta = $('.composer-input', pane);
                const sel = $('.composer-lang', pane);
                if (addEntry(tool, ta.value, { lang: sel ? sel.value : undefined })) { ta.value = ''; if (sel) sel.value = 'auto'; }
                return;
            }
            case 'pick': picking ? stopPicking() : startPicking(tool); return;
<<<<<<< HEAD
            case 'layout': state.layout[tool] = el.dataset.layout; applyLayout(tool); persist(); return;
=======
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
            case 'collapse-all-cards':
            case 'expand-all-cards': {
                const c = act === 'collapse-all-cards';
                state.entries[tool].forEach(e => e.collapsed = c);
                $$('.card', pane).forEach(x => x.classList.toggle('collapsed', c));
                persist();
                return;
            }
            case 'clear-all':
                if (!state.entries[tool].length) return;
                state.entries[tool] = [];
                $('.entries', pane).innerHTML = '';
                updateEmpty(tool);
                persist();
                toast('Cleared');
                return;
        }

        // ---- card actions ----
        if (card) {
            const e = findEntry(card.dataset.tool, card.dataset.id);
            if (!e) return;
            const t = card.dataset.tool;
            const ext = t === 'json' ? 'json' : (LANGS[effLang(e)] || LANGS.plaintext).ext;
            const fname = e.name || (t === 'json' ? 'data' : 'snippet');
            switch (act) {
                case 'toggle-card': e.collapsed = !e.collapsed; card.classList.toggle('collapsed', e.collapsed); persist(); return;
                case 'wrap': e.wrap = !e.wrap; el.classList.toggle('on', e.wrap); $('.code', card).classList.toggle('wrap', e.wrap); persist(); return;
                case 'copy': copy(t === 'json' ? prettyJson(JSON.parse(e.content)) : e.content, t === 'json' ? 'Copied formatted JSON' : 'Copied', el); return;
                case 'copy-min': copy(e.content, 'Copied minified JSON', el); return;
                case 'download': vscode.postMessage({ type: 'save', text: t === 'json' ? prettyJson(JSON.parse(e.content)) : e.content, fileName: fname, ext }); return;
                case 'open': vscode.postMessage({ type: 'openInEditor', text: t === 'json' ? prettyJson(JSON.parse(e.content)) : e.content, language: t === 'json' ? 'json' : vscodeLang(effLang(e)) }); return;
                case 'delete':
                    state.entries[t] = state.entries[t].filter(x => x.id !== e.id);
                    delete folds[e.id]; delete finds[e.id];
                    card.remove();
                    updateEmpty(t);
                    persist();
                    return;
                case 'fold': {
                    const set = folds[e.id] || (folds[e.id] = new Set());
                    const l = +el.dataset.l;
                    set.has(l) ? set.delete(l) : set.add(l);
                    applyFolds(card);
                    return;
                }
                case 'fold-all': {
                    const set = folds[e.id] || (folds[e.id] = new Set());
                    $$('.fold', card).forEach(f => set.add(+f.dataset.l));
                    applyFolds(card);
                    return;
                }
                case 'unfold-all': (folds[e.id] || new Set()).clear(); applyFolds(card); return;
                case 'find-next': stepFind(card, 1); return;
                case 'find-prev': stepFind(card, -1); return;
                case 'jtoggle': { const n = el.closest('.jn'); setJsonNodeOpen(n, n.classList.contains('closed')); return; }
                case 'tree-collapse':
                    $$('.jn', card).forEach(n => { if ($(':scope > .jkids', n)) setJsonNodeOpen(n, n.parentElement.classList.contains('tree')); });
                    return;
                case 'tree-expand': $$('.jn', card).forEach(n => { if ($(':scope > .jkids', n)) setJsonNodeOpen(n, true); }); return;
                case 'copy-path': copy($('.crumb', card).textContent, 'Copied path', el); return;
            }
            return;
        }

        // ---- compare actions ----
        const col = el.closest('.cmp-col');
        const c = state.compare[tool];
        switch (act) {
            case 'swap': { const tmp = c.a; c.a = c.b; c.b = tmp; syncCompareInputs(tool); runCompare(tool); persist(); return; }
            case 'cmp-clear': c.a = blankSide(); c.b = blankSide(); syncCompareInputs(tool); runCompare(tool); persist(); return;
            case 'view': c.view = el.dataset.view; syncCompareInputs(tool); if (lastDiff[tool]) renderResults(tool); persist(); return;
            case 'run-compare': runCompare(tool); return;
            case 'prev-change': stepChange(tool, -1); return;
            case 'next-change': stepChange(tool, 1); return;
            case 'copy-diff': if (lastDiff[tool]) copy(unifiedDiffText(tool), 'Copied unified diff', el); return;
<<<<<<< HEAD
            case 'copy-change-path': copy(el.dataset.path, 'Copied ' + el.dataset.path, el); return;
            case 'goto-path': {
                const t = el.dataset.type;
                if (t !== 'added') gotoJsonPath('a', el.dataset.path);
                if (t !== 'removed') gotoJsonPath('b', el.dataset.path);
                return;
            }
=======
            case 'copy-change-path': copy(el.dataset.path, 'Copied ' + el.dataset.path); return;
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
            case 'expand-gap': {
                for (let k = +el.dataset.from; k < +el.dataset.to; k++) expandedGaps[tool].add(k);
                const diffEl = $('.diff', cmpPane(tool));
                const top = diffEl.scrollTop;
                renderResults(tool);
                $('.diff', cmpPane(tool)).scrollTop = top;
                return;
            }
        }
        if (col) {
            const s = col.dataset.side;
            const side = c[s];
            switch (act) {
                case 'side-copy': if (side.text) copy(side.text, 'Copied ' + s.toUpperCase(), el); return;
                case 'side-clear': c[s] = blankSide(); syncCompareInputs(tool); runCompare(tool); persist(); return;
                case 'side-format': {
                    if (!side.text.trim()) return;
                    if (tool === 'json') {
                        const r = parseJson(side.text);
                        if (!r.ok) { toast('Invalid JSON — cannot format'); return; }
                        side.text = prettyJson(r.value);
                    } else {
                        const lang = side.lang && side.lang !== 'auto' ? side.lang : detectLanguage(side.text).id;
                        try { side.text = formatCodeLocally(side.text, lang); } catch (_) { toast('Could not format'); return; }
                    }
                    syncCompareInputs(tool); runCompare(tool); persist();
                    return;
                }
            }
        }
    });

    // mouse over JSON nodes -> breadcrumb path; click selects (pins) the path
    document.addEventListener('mouseover', ev => {
        const line = ev.target.closest('.jl');
        if (!line) return;
        const card = line.closest('.card');
        if (card.querySelector('.jl.sel')) return;
        $('.crumb', card).textContent = line.parentElement.dataset.path;
    });
    document.addEventListener('click', ev => {
        const line = ev.target.closest('.jl');
        if (!line || picking || ev.target.closest('[data-act]')) return;
        const card = line.closest('.card');
        const was = line.classList.contains('sel');
        $$('.jl.sel', card).forEach(x => x.classList.remove('sel'));
        if (!was) line.classList.add('sel');
        $('.crumb', card).textContent = line.parentElement.dataset.path;
    });

<<<<<<< HEAD
    document.addEventListener('mouseover', ev => {
        const sc = ev.target.closest('.sc');
        $$('.sc.hov').forEach(x => x.classList.remove('hov'));
        if (sc) $$(`.sc[data-r="${sc.dataset.r}"]`, sc.closest('.diff')).forEach(x => x.classList.add('hov'));
    });

    let hSyncing = false;
    document.addEventListener('scroll', ev => {
        const col = ev.target.classList && ev.target.classList.contains('scol') ? ev.target : null;
        if (!col || hSyncing) return;
        const other = $(`.scol[data-col="${col.dataset.col === 'a' ? 'b' : 'a'}"]`, col.parentElement);
        if (!other) return;
        hSyncing = true;
        other.scrollLeft = col.scrollLeft;
        requestAnimationFrame(() => hSyncing = false);
    }, true);

=======
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
    document.addEventListener('input', ev => {
        const el = ev.target;
        const card = el.closest('.card');
        if (card && el.dataset.act === 'rename') {
            const e = findEntry(card.dataset.tool, card.dataset.id);
            if (e) { e.name = el.value; persist(); }
            return;
        }
        if (card && el.dataset.act === 'find') { runFind(card, el.value); return; }
        const col = el.closest('.cmp-col');
        if (col && el.dataset.field) {
            const tool = el.closest('.pane').dataset.tool;
            const s = col.dataset.side;
            state.compare[tool][s][el.dataset.field] = el.value;
            if (el.dataset.field === 'text') {
                updateSideFoot(tool, s);
                if (tool === 'code' && (state.compare.code[s].lang || 'auto') === 'auto') langRefresh[s](tool, s);
                liveCompare[tool]();
            }
            persist();
        }
    });

    document.addEventListener('change', ev => {
        const el = ev.target;
        const card = el.closest('.card');
        if (card && el.dataset.act === 'lang') {
            const e = findEntry('code', card.dataset.id);
            e.lang = el.value;
            const L = LANGS[effLang(e)] || LANGS.plaintext;
            el.style.background = L.color;
            el.classList.toggle('dark-text', !!L.dark);
            renderCodeBody(card, e);
            persist();
            return;
        }
        const pane = el.closest('.pane');
        if (!pane) return;
        const tool = pane.dataset.tool;
<<<<<<< HEAD
        if (el.dataset.act === 'opt') {
            state.compare[tool][el.dataset.opt] = el.checked;
            if (el.dataset.opt === 'wrap') { if (lastDiff[tool]) renderResults(tool); } else runCompare(tool);
            persist();
            return;
        }
=======
        if (el.dataset.act === 'opt') { state.compare[tool][el.dataset.opt] = el.checked; runCompare(tool); persist(); return; }
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
        if (el.dataset.act === 'sync') { state.syncScroll = el.checked; $$('[data-act="sync"]').forEach(x => x.checked = el.checked); persist(); return; }
        const col = el.closest('.cmp-col');
        if (col && el.dataset.field === 'lang') { state.compare[tool][col.dataset.side].lang = el.value; updateSideLang(tool, col.dataset.side); persist(); }
    });

    document.addEventListener('keydown', ev => {
        const el = ev.target;
        if (ev.key === 'Escape' && picking) { stopPicking(); return; }
        if (el.classList && el.classList.contains('composer-input') && ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
            ev.preventDefault();
            $('[data-act="add"]', el.closest('.pane')).click();
            return;
        }
        if (el.dataset && el.dataset.act === 'find' && ev.key === 'Enter') {
            ev.preventDefault();
            stepFind(el.closest('.card'), ev.shiftKey ? -1 : 1);
            return;
        }
        if (el.dataset && el.dataset.act === 'find' && ev.key === 'Escape') { el.value = ''; runFind(el.closest('.card'), ''); return; }
        // Tab inserts spaces in compare textareas
        if (el.tagName === 'TEXTAREA' && el.closest('.cmp-col') && ev.key === 'Tab' && !ev.shiftKey) {
            ev.preventDefault();
            const s = el.selectionStart;
            el.setRangeText('    ', s, el.selectionEnd, 'end');
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        // Ctrl+F focuses the first find box of the visible viewer
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'f') {
            const f = $(`#pane-${state.tool}-view.active .card:not(.collapsed) [data-act="find"]`);
            if (f) { ev.preventDefault(); f.focus(); f.select(); }
        }
    });

    // sync scroll between A and B textareas
    let syncing = false;
    ['code', 'json'].forEach(tool => {
        const ta = s => $('[data-field="text"]', sideEl(tool, s));
        [['a', 'b'], ['b', 'a']].forEach(([from, to]) => {
            ta(from).addEventListener('scroll', () => {
                if (!state.syncScroll || syncing) return;
                syncing = true;
                ta(to).scrollTop = ta(from).scrollTop;
                ta(to).scrollLeft = ta(from).scrollLeft;
                requestAnimationFrame(() => syncing = false);
            });
        });
    });

    // drag & drop files onto the composer (or onto a compare side)
    function readFiles(files, cb) {
        Array.from(files).forEach(f => { const r = new FileReader(); r.onload = () => cb(String(r.result), f.name); r.readAsText(f); });
    }
    document.addEventListener('dragover', ev => {
        const target = ev.target.closest('.composer, .cmp-col');
        if (!target) return;
        ev.preventDefault();
        target.classList.add('drag');
    });
    document.addEventListener('dragleave', ev => { const t = ev.target.closest('.composer, .cmp-col'); if (t) t.classList.remove('drag'); });
    document.addEventListener('drop', ev => {
        const target = ev.target.closest('.composer, .cmp-col');
        if (!target || !ev.dataTransfer.files.length) return;
        ev.preventDefault();
        target.classList.remove('drag');
        const tool = target.closest('.pane').dataset.tool;
        if (target.classList.contains('composer')) {
            readFiles(ev.dataTransfer.files, (text, name) => addEntry(tool, text, { name, fileName: name }));
        } else {
            const s = target.dataset.side;
            readFiles([ev.dataTransfer.files[0]], (text, name) => { loadSide(tool, s, { text, name, lang: 'auto' }); runCompare(tool); });
        }
    });

    /* ======================= messages from the extension ======================= */
    window.addEventListener('message', ev => {
        const m = ev.data;
        if (!m) return;
        if (m.type === 'settings') {
            const changed = state.settings.jsonIndent !== m.jsonIndent;
            state.settings.jsonIndent = m.jsonIndent;
            if (changed && lastDiff.json) runCompare('json');
            persist();
            return;
        }
        if (m.type === 'add') {
            const tool = m.target === 'json' ? 'json' : 'code';
            if (m.toCompare) {
                const c = state.compare[tool];
                const s = !c.a.text.trim() ? 'a' : 'b';
                const text = tool === 'json' ? (parseJson(m.content).ok ? prettyJson(parseJson(m.content).value) : m.content) : m.content;
                loadSide(tool, s, { text, name: m.name || '', lang: m.lang || 'auto' });
                go(tool, 'compare');
                runCompare(tool);
                toast(`Loaded into ${s.toUpperCase()}${s === 'a' ? ' — send another selection for B' : ''}`);
            } else {
                go(tool, 'view');
                if (addEntry(tool, m.content, { name: m.name, lang: m.lang, fileName: m.fileName })) {
                    $(`#pane-${tool}-view`).scrollTop = 0;
                    toast(`Added to ${tool === 'json' ? 'JSON' : 'Code'} viewer`);
                }
            }
        }
    });

    function vscodeLang(id) {
        return ({ shell: 'shellscript', objectscript: 'objectscript', plaintext: 'plaintext' })[id] || id;
    }

    /* ======================= boot ======================= */
    ['code', 'json'].forEach(tool => {
        const list = $(`#pane-${tool}-view .entries`);
        state.entries[tool].forEach(e => {
            try { list.appendChild(renderCard(tool, e)); } catch (err) { /* skip a corrupted entry */ }
        });
        updateEmpty(tool);
<<<<<<< HEAD
        applyLayout(tool);
=======
>>>>>>> 404db4675b4bc2e698a7de074f685a589623fddc
        syncCompareInputs(tool);
        if (state.compare[tool].a.text && state.compare[tool].b.text) runCompare(tool);
    });
    applyNav();
    vscode.postMessage({ type: 'ready' });
})();
