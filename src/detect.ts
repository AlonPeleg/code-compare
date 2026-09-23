/** Decides whether something sent from the editor belongs in the JSON tab or the Code tab. */

export interface SendPayload {
    target: 'json' | 'code';
    content: string;
    name: string;
    /** Internal Dev Toolkit language id (only for the code tab). undefined = auto-detect in the webview. */
    lang?: string;
    fileName?: string;
    toCompare: boolean;
}

/** VS Code languageId -> Dev Toolkit language id */
const VSCODE_LANG_MAP: Record<string, string> = {
    typescript: 'typescript',
    typescriptreact: 'typescript',
    javascript: 'javascript',
    javascriptreact: 'javascript',
    java: 'java',
    csharp: 'csharp',
    python: 'python',
    cpp: 'cpp',
    'cuda-cpp': 'cpp',
    c: 'c',
    go: 'go',
    rust: 'rust',
    php: 'php',
    ruby: 'ruby',
    kotlin: 'kotlin',
    swift: 'swift',
    sql: 'sql',
    shellscript: 'shell',
    powershell: 'shell',
    bat: 'shell',
    json: 'json',
    jsonc: 'json',
    json5: 'json',
    xml: 'xml',
    xsl: 'xml',
    svg: 'xml',
    html: 'html',
    vue: 'html',
    css: 'css',
    scss: 'css',
    less: 'css',
    yaml: 'yaml',
    dockercompose: 'yaml',
    objectscript: 'objectscript',
    'objectscript-class': 'objectscript',
    'objectscript-macros': 'objectscript',
    'objectscript-int': 'objectscript',
    plaintext: 'plaintext'
};

/** Strips // and /* *\/ comments (outside strings) and trailing commas, so JSONC can be parsed. */
export function stripJsonc(text: string): string {
    let out = '';
    let inStr = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];
        if (inStr) {
            out += ch;
            if (ch === '\\') { out += next ?? ''; i++; }
            else if (ch === '"') { inStr = false; }
            continue;
        }
        if (ch === '"') { inStr = true; out += ch; continue; }
        if (ch === '/' && next === '/') {
            while (i < text.length && text[i] !== '\n') { i++; }
            out += '\n';
            continue;
        }
        if (ch === '/' && next === '*') {
            i += 2;
            while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) { i++; }
            i++;
            continue;
        }
        out += ch;
    }
    return out.replace(/,(\s*[}\]])/g, '$1');
}

/** Returns normalized JSON text if `text` is a JSON object/array, otherwise undefined. */
export function asJson(text: string, languageId?: string): string | undefined {
    const trimmed = text.trim();
    if (!/^[\[{]/.test(trimmed)) { return undefined; }
    try {
        const v = JSON.parse(trimmed);
        if (v !== null && typeof v === 'object') { return trimmed; }
    } catch { /* fall through */ }
    // JSON with comments / trailing commas (tsconfig.json, settings.json, a JSON-ish selection...)
    try {
        const cleaned = stripJsonc(trimmed).trim();
        const v = JSON.parse(cleaned);
        if (v !== null && typeof v === 'object') {
            // Only accept the cleaned version when it came from a JSON-family file, or it clearly
            // was JSON to begin with (starts with a quoted key / array) — avoids swallowing JS objects.
            if ((languageId && /^json/.test(languageId)) || /^\{\s*"|^\[/.test(trimmed)) { return cleaned; }
        }
    } catch { /* not JSON */ }
    return undefined;
}

export function buildPayload(text: string, languageId: string | undefined, fileName: string | undefined, name: string, toCompare: boolean): SendPayload {
    const json = asJson(text, languageId);
    if (json !== undefined) {
        return { target: 'json', content: json, name, fileName, toCompare };
    }
    let lang = languageId ? VSCODE_LANG_MAP[languageId] : undefined;
    // A non-JSON selection inside a .json file (e.g. a single value) is better shown as code.
    if (lang === 'json') { lang = undefined; }
    // 'plaintext' from VS Code usually just means "unknown" -> let the webview auto-detect.
    if (lang === 'plaintext') { lang = undefined; }
    return { target: 'code', content: text, name, lang, fileName, toCompare };
}
