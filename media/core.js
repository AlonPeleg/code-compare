/* Dev Toolkit core — language detection, tokenizer, formatters, fold ranges and Myers diff.
   Ported from the Dev Toolkit website (https://alonpeleg.github.io/devtools/, code.html). Pure functions, no DOM. */
const RX = {
    blockComment: '/\\*[\\s\\S]*?\\*/',
    lineSlash: '//[^\\n]*',
    lineHash: '#[^\\n]*',
    lineDoubleDash: '--[^\\n]*',
    dqstr: '"(?:\\\\.|[^"\\\\\\n])*"',
    sqstr: "'(?:\\\\.|[^'\\\\\\n])*'",
    btstr: '`(?:\\\\.|[^`\\\\])*`',
    dqstrML: '"(?:\\\\.|[^"\\\\])*"',
    tripleD: '"""[\\s\\S]*?"""',
    tripleS: "'''[\\s\\S]*?'''",
    num: '\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?[a-zA-Z]{0,2}\\b',
    osStr: '"(?:""|[^"\\n])*"'
};
function kw(list) { return '\\b(?:' + list.join('|') + ')\\b'; }

const JS_KEYWORDS = ['break','case','catch','class','const','continue','debugger','default','delete','do','else','export','extends','finally','for','function','if','import','in','instanceof','let','new','of','return','static','super','switch','this','throw','try','typeof','var','void','while','with','yield','async','await','true','false','null','undefined','get','set'];
const TS_KEYWORDS = JS_KEYWORDS.concat(['interface','type','enum','implements','private','public','protected','readonly','namespace','declare','abstract','as','is','keyof','infer','never','unknown','any','string','number','boolean','object','symbol','bigint','satisfies']);
const JAVA_KEYWORDS = ['abstract','assert','boolean','break','byte','case','catch','char','class','const','continue','default','do','double','else','enum','extends','final','finally','float','for','goto','if','implements','import','instanceof','int','interface','long','native','new','package','private','protected','public','return','short','static','strictfp','super','switch','synchronized','this','throw','throws','transient','try','void','volatile','while','var','true','false','null'];
const CSHARP_KEYWORDS = ['abstract','as','base','bool','break','byte','case','catch','char','checked','class','const','continue','decimal','default','delegate','do','double','else','enum','event','explicit','extern','false','finally','fixed','float','for','foreach','goto','if','implicit','in','int','interface','internal','is','lock','long','namespace','new','null','object','operator','out','override','params','private','protected','public','readonly','ref','return','sbyte','sealed','short','sizeof','stackalloc','static','string','struct','switch','this','throw','true','try','typeof','uint','ulong','unchecked','unsafe','ushort','using','virtual','void','volatile','while','var','async','await','get','set'];
const CPP_KEYWORDS = ['alignas','alignof','and','asm','auto','bool','break','case','catch','char','class','const','constexpr','continue','decltype','default','delete','do','double','dynamic_cast','else','enum','explicit','export','extern','false','float','for','friend','goto','if','inline','int','long','mutable','namespace','new','noexcept','nullptr','operator','private','protected','public','register','reinterpret_cast','return','short','signed','sizeof','static','static_cast','struct','switch','template','this','throw','true','try','typedef','typename','union','unsigned','using','virtual','void','volatile','while'];
const C_KEYWORDS = ['auto','break','case','char','const','continue','default','do','double','else','enum','extern','float','for','goto','if','int','long','register','return','short','signed','sizeof','static','struct','switch','typedef','union','unsigned','void','volatile','while'];
const GO_KEYWORDS = ['break','case','chan','const','continue','default','defer','else','fallthrough','for','func','go','goto','if','import','interface','map','package','range','return','select','struct','switch','type','var','true','false','nil','iota'];
const RUST_KEYWORDS = ['as','break','const','continue','crate','else','enum','extern','false','fn','for','if','impl','in','let','loop','match','mod','move','mut','pub','ref','return','self','Self','static','struct','super','trait','true','type','unsafe','use','where','while','async','await','dyn'];
const KOTLIN_KEYWORDS = ['as','break','class','continue','do','else','false','for','fun','if','in','interface','is','null','object','package','return','super','this','throw','true','try','typealias','val','var','when','while','by','companion','constructor','data','enum','import','init','inner','internal','lateinit','open','operator','override','private','protected','public','sealed','suspend'];
const SWIFT_KEYWORDS = ['associatedtype','class','deinit','enum','extension','fileprivate','func','import','init','inout','internal','let','open','operator','private','protocol','public','rethrows','static','struct','subscript','typealias','var','break','case','continue','default','defer','do','else','fallthrough','for','guard','if','in','repeat','return','switch','where','while','as','Any','catch','false','is','nil','self','Self','super','throw','throws','true','try'];
const PHP_KEYWORDS = ['abstract','and','array','as','break','callable','case','catch','class','clone','const','continue','declare','default','do','echo','else','elseif','empty','enddeclare','endfor','endforeach','endif','endswitch','endwhile','extends','final','finally','fn','for','foreach','function','global','goto','if','implements','include','include_once','instanceof','insteadof','interface','isset','list','match','namespace','new','or','print','private','protected','public','require','require_once','return','static','switch','throw','trait','try','unset','use','var','while','xor','yield','true','false','null'];
const PY_KEYWORDS = ['False','None','True','and','as','assert','async','await','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield','self'];
const RUBY_KEYWORDS = ['BEGIN','END','alias','and','begin','break','case','class','def','defined?','do','else','elsif','end','ensure','false','for','if','in','module','next','nil','not','or','redo','rescue','retry','return','self','super','then','true','undef','unless','until','when','while','yield'];
const OS_KEYWORDS = ['Class','ClassMethod','Method','Property','Parameter','Index','Storage','Extends','As','Public','Private','Set','Do','If','Else','ElseIf','For','While','Quit','Return','Write','Kill','New','Job','Halt','Try','Catch','Throw','Continue','Goto','Lock','Merge','Read','Tcommit','Trollback','Tstart','Xecute','Zwrite','Zkill','Type','Not','Or','And'];
const SQL_KEYWORDS = ['SELECT','FROM','WHERE','JOIN','INNER','LEFT','RIGHT','OUTER','ON','GROUP','BY','ORDER','HAVING','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','ALTER','DROP','INDEX','VIEW','AS','AND','OR','NOT','NULL','IS','IN','LIKE','BETWEEN','DISTINCT','LIMIT','OFFSET','UNION','ALL','EXISTS','CASE','WHEN','THEN','ELSE','END','PRIMARY','KEY','FOREIGN','REFERENCES','DEFAULT','CONSTRAINT'];
const SHELL_KEYWORDS = ['if','then','else','elif','fi','for','while','until','do','done','case','esac','function','return','break','continue','export','local','readonly','shift','exit','echo','printf','set','unset','source','eval','exec','trap','test'];

const LANGS = {
    json: { label: 'JSON', color: '#e8b94a', ext: 'json', dark: true },
    xml: { label: 'XML', color: '#e37933', ext: 'xml' },
    html: { label: 'HTML', color: '#e34c26', ext: 'html' },
    css: { label: 'CSS', color: '#2965f1', ext: 'css' },
    typescript: { label: 'TypeScript', color: '#3178c6', ext: 'ts' },
    javascript: { label: 'JavaScript', color: '#f0db4f', ext: 'js', dark: true },
    java: { label: 'Java', color: '#e76f00', ext: 'java' },
    csharp: { label: 'C#', color: '#9b4f96', ext: 'cs' },
    python: { label: 'Python', color: '#3776ab', ext: 'py' },
    objectscript: { label: 'ObjectScript', color: '#b23fd6', ext: 'cls' },
    cpp: { label: 'C++', color: '#f34b7d', ext: 'cpp' },
    c: { label: 'C', color: '#8393c7', ext: 'c' },
    go: { label: 'Go', color: '#00add8', ext: 'go' },
    rust: { label: 'Rust', color: '#dea584', dark: true, ext: 'rs' },
    php: { label: 'PHP', color: '#8892bf', ext: 'php' },
    ruby: { label: 'Ruby', color: '#e0524b', ext: 'rb' },
    kotlin: { label: 'Kotlin', color: '#a97bff', ext: 'kt' },
    swift: { label: 'Swift', color: '#f05138', ext: 'swift' },
    sql: { label: 'SQL', color: '#4fc3d9', ext: 'sql' },
    shell: { label: 'Shell', color: '#89e051', dark: true, ext: 'sh' },
    yaml: { label: 'YAML', color: '#e0777d', ext: 'yaml' },
    plaintext: { label: 'Plain Text', color: '#8a8a8a', ext: 'txt' }
};
const LANG_ORDER = ['typescript','javascript','java','csharp','python','objectscript','cpp','c','go','rust','php','ruby','kotlin','swift','sql','shell','json','xml','html','css','yaml','plaintext'];

function count(re, s) { const m = s.match(re); return m ? m.length : 0; }
function scoreSignals(code, signals) {
    let score = 0;
    for (const [re, weight, cap] of signals) {
        const c = count(re, code);
        if (c > 0) score += Math.min(c, cap || 3) * weight;
    }
    return score;
}
const SIGNALS = {
    html: [[/<!doctype html/i, 8, 1], [/<html[\s>]/i, 6, 1], [/<\/?(div|span|body|head|script|style|table|tr|td|input|button|form|meta|link)\b/gi, 1, 10]],
    xml: [[/^\s*<\?xml/i, 8, 1], [/<\/[a-zA-Z_][\w:.-]*>/g, 1, 8], [/xmlns[:=]/g, 3, 3]],
    css: [[/\{[^{}]*:[^{}]*;[^{}]*\}/g, 2, 8], [/@media\b/g, 3, 2], [/^[.#][\w-]+[^{]*\{/mg, 2, 6], [/!important/g, 3, 2]],
    typescript: [[/\binterface\s+\w+/g, 4, 3], [/:\s*(string|number|boolean|any|void|unknown|never)\b/g, 3, 6], [/\bimplements\s+\w+/g, 3, 2], [/\benum\s+\w+/g, 4, 2], [/\b(public|private|protected)\s+(readonly\s+)?\w+/g, 3, 4], [/:\s*\w+\[\]/g, 2, 3], [/\bas\s+\w+/g, 2, 3], [/import\s+type\b/g, 4, 2], [/<\w+>/g, 1, 4], [/@\w+\(/g, 2, 3]],
    javascript: [[/\bfunction\s*\w*\s*\(/g, 2, 5], [/=>/g, 2, 6], [/\b(const|let|var)\s+\w+\s*=/g, 1, 8], [/console\.log\(/g, 3, 3], [/require\(['"]/g, 3, 2], [/module\.exports/g, 3, 1], [/document\.\w+/g, 2, 3], [/===|!==/g, 1, 4]],
    java: [[/\bpublic\s+(static\s+)?(final\s+)?class\s+\w+/g, 5, 2], [/public\s+static\s+void\s+main\s*\(/g, 6, 1], [/System\.out\.println\(/g, 5, 3], [/import\s+java\./g, 4, 4], [/@Override/g, 3, 2], [/\bprivate\s+\w+\s+\w+;/g, 2, 4]],
    csharp: [[/using\s+System(\.\w+)*;/g, 5, 3], [/namespace\s+\w+/g, 4, 2], [/Console\.WriteLine\(/g, 5, 3], [/public\s+static\s+void\s+Main\s*\(/g, 5, 1], [/\{\s*get;\s*set;\s*\}/g, 4, 3], [/\basync\s+Task\b/g, 3, 2]],
    python: [[/^\s*def\s+\w+\(.*\):\s*$/mg, 4, 6], [/^\s*import\s+\w+/mg, 2, 4], [/^\s*from\s+\w+\s+import\b/mg, 3, 3], [/^\s*elif\b/mg, 3, 3], [/\bself\b/g, 2, 6], [/if\s+__name__\s*==\s*['"]__main__['"]/g, 8, 1], [/print\(/g, 2, 4], [/^\s*@\w+/mg, 2, 3]],
    objectscript: [[/\bClassMethod\s+\w+/g, 5, 3], [/^\s*Class\s+[\w.%]+\s+Extends/mg, 6, 1], [/\bProperty\s+\w+\s+As\s+%?\w+/g, 4, 3], [/##class\(/g, 4, 4], [/##super\(/g, 3, 2], [/\$\$\$\w+/g, 3, 3], [/^\s*Method\s+\w+\(.*\)\s+as\b/mgi, 4, 3], [/Storage\s+Default/g, 4, 1], [/&sql\(/g, 3, 2], [/^\s*\.\s+\S/mg, 1, 4], [/\bQuit\b/g, 1, 3], [/%[A-Za-z]\w*/g, 1, 4]],
    cpp: [[/#include\s*<\w+>/g, 2, 3], [/std::/g, 3, 6], [/using\s+namespace\s+std/g, 5, 1], [/template\s*</g, 4, 2], [/cout\s*<</g, 4, 2], [/cin\s*>>/g, 4, 2], [/nullptr/g, 3, 2]],
    c: [[/#include\s*<\w+\.h>/g, 3, 3], [/\bint\s+main\s*\(/g, 4, 1], [/printf\(/g, 3, 4], [/scanf\(/g, 3, 2], [/->\w+/g, 1, 4], [/\bmalloc\(/g, 3, 2]],
    go: [[/^package\s+main/mg, 6, 1], [/func\s+main\s*\(/g, 5, 1], [/fmt\.\w+\(/g, 4, 4], [/:=/g, 2, 6], [/^import\s*\(/mg, 2, 1]],
    rust: [[/fn\s+main\s*\(/g, 5, 1], [/let\s+mut\s+\w+/g, 4, 3], [/println!\(/g, 5, 3], [/\buse\s+std::/g, 3, 3], [/->\s*\w+/g, 1, 4], [/impl\s+\w+/g, 3, 2]],
    php: [[/<\?php/g, 8, 1], [/\$\w+/g, 1, 10], [/->\w+\(/g, 1, 4], [/\becho\b/g, 2, 3]],
    ruby: [[/^\s*def\s+\w+/mg, 3, 5], [/\bputs\b/g, 3, 3], [/require(_relative)?\s+['"]/g, 3, 2], [/attr_(accessor|reader|writer)/g, 4, 2], [/\bend\b/g, 1, 8], [/:\w+\s*=>/g, 2, 3], [/\bdo\s*\|/g, 2, 2]],
    kotlin: [[/fun\s+main\s*\(/g, 5, 1], [/\bval\s+\w+/g, 2, 5], [/\bvar\s+\w+\s*[:=]/g, 1, 5], [/println\(/g, 2, 3], [/companion\s+object/g, 4, 1], [/\bwhen\s*\(/g, 2, 2]],
    swift: [[/import\s+(Foundation|UIKit|SwiftUI)/g, 5, 1], [/\bfunc\s+\w+\(/g, 2, 5], [/\bvar\s+\w+\s*:/g, 1, 4], [/\blet\s+\w+\s*=/g, 1, 4], [/guard\s+let\b/g, 3, 2], [/@objc\b/g, 2, 2]],
    sql: [[/\bSELECT\b/gi, 4, 2], [/\bFROM\b/gi, 3, 2], [/\bWHERE\b/gi, 2, 2], [/\bCREATE\s+TABLE\b/gi, 5, 1], [/\bINSERT\s+INTO\b/gi, 4, 1], [/\bJOIN\b/gi, 2, 3], [/\bGROUP\s+BY\b/gi, 3, 1]],
    shell: [[/^#!\/bin\/(ba|z)?sh/mg, 8, 1], [/\becho\b/g, 2, 4], [/\bfi\b/g, 2, 3], [/\bdone\b/g, 2, 3], [/\$\{?\w+\}?/g, 1, 6], [/^\s*if\s*\[/mg, 3, 2]],
    yaml: [[/^---/mg, 3, 1], [/^[\w.-]+:\s*.*$/mg, 1, 8], [/^\s*-\s+\w+/mg, 1, 5]]
};

const EXT_MAP = { ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript', java: 'java', cs: 'csharp', py: 'python', cls: 'objectscript', mac: 'objectscript', int: 'objectscript', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', c: 'c', h: 'c', go: 'go', rs: 'rust', php: 'php', rb: 'ruby', kt: 'kotlin', kts: 'kotlin', swift: 'swift', sql: 'sql', sh: 'shell', bash: 'shell', yml: 'yaml', yaml: 'yaml', css: 'css', html: 'html', htm: 'html', xml: 'xml', json: 'json' };

function detectLanguage(code, filename) {
    const trimmed = code.trim();
    if (!trimmed) return { id: 'plaintext', label: 'Plain Text', score: 0, confidence: 'none', runnerUp: null };

    let extHint = null;
    if (filename) {
        const m = /\.([a-zA-Z0-9]+)$/.exec(filename);
        if (m && EXT_MAP[m[1].toLowerCase()]) extHint = EXT_MAP[m[1].toLowerCase()];
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (parsed !== null && typeof parsed === 'object') {
            return { id: 'json', label: LANGS.json.label, score: 999, confidence: 'high', runnerUp: null };
        }
    } catch (e) { /* not JSON */ }

    // A document that actually STARTS with a doctype or <html> root tag is a full HTML page, no
    // matter how much JS/CSS it embeds — a giant <script> block doesn't change what kind of file
    // the document itself is, the same way a .vue file full of JS isn't reclassified as
    // JavaScript. Without this early check, a self-contained HTML tool (small markup shell,
    // thousands of lines of embedded <script>) loses the frequency-based vote below to
    // JS/TS purely on raw token count, since the JS signals have no fixed cap while the HTML tag
    // signal below is capped low — that's what was misdetecting this file as TypeScript.
    if (/^<!doctype\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
        return { id: 'html', label: LANGS.html.label, score: 999, confidence: 'high', runnerUp: null };
    }

    const raw = {};
    for (const id of Object.keys(SIGNALS)) raw[id] = scoreSignals(code, SIGNALS[id]);

    if (raw.typescript >= 4) { raw.typescript = raw.typescript + raw.javascript; raw.javascript = 0; }
    else { raw.typescript = 0; }
    if (raw.cpp >= 4) { raw.c = 0; }
    if (raw.html >= 5) { raw.xml = 0; }

    // A single well-formed root element with matching open/close tags (e.g. <root><a>1</a></root>)
    // reads as XML confidently even with no <?xml ...?> prolog and no xmlns attribute — most real
    // XML snippets (config fragments, SOAP bodies, custom markup) have neither. Before this, xml's
    // only signal was raw closing-tag frequency, which a short snippet like that scores too low on
    // to beat the plaintext floor below. This defers to HTML whenever the content already scored as
    // HTML-ish (raw.html >= 5, matched above) so real HTML fragments aren't reclassified.
    if (raw.html < 5 && /^<([a-zA-Z_][\w:.-]*)\b[^>]*>[\s\S]*<\/\1>\s*$/.test(trimmed)) {
        raw.xml = Math.max(raw.xml, 6);
    }

    let bestId = 'plaintext', bestScore = 0, second = 0;
    const entries = Object.keys(raw).map(id => [id, raw[id]]).sort((a, b) => b[1] - a[1]);
    if (entries.length) { bestId = entries[0][0]; bestScore = entries[0][1]; second = entries[1] ? entries[1][1] : 0; }

    if (extHint && (bestScore < 3 || extHint === bestId)) { bestId = extHint; bestScore = Math.max(bestScore, 5); }

    if (bestScore <= 2) return { id: 'plaintext', label: LANGS.plaintext.label, score: bestScore, confidence: 'none', runnerUp: null };
    let confidence = 'low';
    if (bestScore >= 10 && (bestScore - second) >= 4) confidence = 'high';
    else if (bestScore >= 5) confidence = 'medium';
    const runnerUp = (second >= 3 && entries[1]) ? entries[1][0] : null;
    return { id: bestId, label: LANGS[bestId].label, score: bestScore, confidence, runnerUp };
}

/* =========================================================================
   FORMAT / BEAUTIFY — hand-rolled, dependency-free pretty-printers. These are
   used directly as the synchronous local fallback (Monaco not loaded, or a
   view-mode format request), and are also wrapped as Monaco
   registerDocumentFormattingEditProvider implementations (see
   registerCustomFormatters, near the Monaco integration below) for every
   language Monaco's bundled "editor.main" build has no native formatter for
   — so both the live editor's own Format Document command and the plain
   view-mode renderer end up running the exact same formatting logic.
   ========================================================================= */
function tidyWhitespace(code) {
    const lines = code.replace(/\r\n?/g, '\n').split('\n').map(l => l.replace(/[ \t]+$/, ''));
    const out = [];
    let blankRun = 0;
    for (const l of lines) {
        if (l === '') { blankRun++; if (blankRun <= 1) out.push(l); }
        else { blankRun = 0; out.push(l); }
    }
    while (out.length && out[out.length - 1] === '') out.pop();
    return out.join('\n');
}

// Rough "does this look minified" heuristic — only when code is basically unbroken do we risk
// inserting new line breaks (the one part of this feature that changes more than indentation).
function looksMinified(code) {
    const lines = code.split('\n');
    if (lines.length <= 2 && code.length > 200) return true;
    return (code.length / lines.length) > 300;
}

// Inserts line breaks after `{`, `;` and around `}` so minified/dense brace-language code gets
// split into one-statement-per-line before the indent pass below. String/template/char literals
// and comments are tracked so their contents are never split or altered.
function splitCodeStatements(code) {
    let out = '';
    let i = 0;
    const n = code.length;
    let state = 'normal';
    while (i < n) {
        const ch = code[i], next = code[i + 1];
        if (state === 'normal') {
            if (ch === '/' && next === '/') { state = 'line'; out += ch; i++; continue; }
            if (ch === '/' && next === '*') { state = 'block'; out += ch; i++; continue; }
            if (ch === "'") { state = 'sq'; out += ch; i++; continue; }
            if (ch === '"') { state = 'dq'; out += ch; i++; continue; }
            if (ch === '`') { state = 'bt'; out += ch; i++; continue; }
            if (ch === '{') {
                out += ch;
                if (next !== '}' && next !== undefined && next !== '\n') out += '\n';
                i++; continue;
            }
            if (ch === '}') {
                if (out.length && out[out.length - 1] !== '\n' && out[out.length - 1] !== '{') out += '\n';
                out += ch;
                if (next !== undefined && next !== '\n' && next !== ';' && next !== ',' && next !== ')') out += '\n';
                i++; continue;
            }
            if (ch === ';') {
                out += ch;
                if (next !== undefined && next !== '\n') out += '\n';
                i++; continue;
            }
            out += ch; i++; continue;
        }
        if (state === 'line') { out += ch; if (ch === '\n') state = 'normal'; i++; continue; }
        if (state === 'block') { out += ch; if (ch === '*' && next === '/') { out += next; i += 2; state = 'normal'; continue; } i++; continue; }
        // sq / dq / bt string states
        out += ch;
        if (ch === '\\' && next !== undefined) { out += next; i += 2; continue; }
        const closer = state === 'sq' ? "'" : state === 'dq' ? '"' : '`';
        if (ch === closer) state = 'normal';
        i++; continue;
    }
    return out;
}

// Re-indents brace/bracket/paren-nested code line by line, purely from bracket depth. Never
// rewrites a line's own text — only the leading whitespace in front of it — so it's safe to run
// on already-reasonable code as a "clean up the indentation" pass.
function reindentBraceCode(code, indentUnit) {
    indentUnit = indentUnit || '  ';
    const lines = code.split('\n');
    let depth = 0;
    let inBlockComment = false;
    const out = [];
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (inBlockComment) {
            out.push(line);
            if (line.indexOf('*/') !== -1) inBlockComment = false;
            continue;
        }
        if (line === '') { out.push(''); continue; }
        let leadDedent = 0, j = 0;
        while (j < line.length && (line[j] === '}' || line[j] === ')' || line[j] === ']')) {
            leadDedent++; j++;
            while (j < line.length && line[j] === ' ') j++;
        }
        const printDepth = Math.max(0, depth - leadDedent);
        out.push(indentUnit.repeat(printDepth) + line);

        let delta = 0, k = 0, localState = 'normal';
        while (k < line.length) {
            const ch = line[k], nx = line[k + 1];
            if (localState === 'normal') {
                if (ch === '/' && nx === '/') break;
                if (ch === '/' && nx === '*') { localState = 'block'; k += 2; continue; }
                if (ch === "'") { localState = 'sq'; k++; continue; }
                if (ch === '"') { localState = 'dq'; k++; continue; }
                if (ch === '`') { localState = 'bt'; k++; continue; }
                if (ch === '{' || ch === '(' || ch === '[') delta++;
                else if (ch === '}' || ch === ')' || ch === ']') delta--;
                k++; continue;
            }
            if (localState === 'block') { if (ch === '*' && nx === '/') { localState = 'normal'; k += 2; continue; } k++; continue; }
            if (ch === '\\') { k += 2; continue; }
            const closer = localState === 'sq' ? "'" : localState === 'dq' ? '"' : '`';
            if (ch === closer) localState = 'normal';
            k++; continue;
        }
        if (localState === 'block') inBlockComment = true;
        depth = Math.max(0, depth + delta);
    }
    return out.join('\n');
}
function formatBraceLanguage(code) {
    const prepared = looksMinified(code) ? splitCodeStatements(code) : code;
    return reindentBraceCode(prepared, '  ');
}

// XML/HTML pretty-printer: tokenizes tags/text/comments/doctype/PI/CDATA and re-indents by nesting
// depth. A leaf element whose only content is a single run of text (e.g. <a>1</a>) is kept on one
// line, matching how most XML/HTML formatters render simple leaves.
const XML_VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
// These are built by concatenation — never spelled out as a literal contiguous open/close
// HTML-comment marker or CDATA-open marker anywhere in this file's own source, including in this
// comment. That exact character run has special meaning to HTML's OWN tokenizer even inside a
// <script> block (it's the legacy "hide script body from old browsers" comment rule) — spelling
// it out literally here could make an editor's embedded-HTML/JS language service (and, per spec, a
// real browser) misparse everything after this point in the file.
const XML_COMMENT_OPEN = '<!' + '--';
const XML_COMMENT_CLOSE = '--' + '>';
const XML_CDATA_OPEN = '<!' + '[CDATA[';
function formatXML(code) {
    const src = code.trim();
    if (!src) return code;
    const re = new RegExp(
        XML_COMMENT_OPEN + '[\\s\\S]*?' + XML_COMMENT_CLOSE +
        '|' + XML_CDATA_OPEN.replace('[', '\\[').replace('[', '\\[') + '[\\s\\S]*?\\]\\]>' +
        '|<!DOCTYPE[^>]*>|<\\?[\\s\\S]*?\\?>|<\\/[^>]+>|<[^>]+>|[^<]+',
        'g'
    );
    const tokens = [];
    let m;
    while ((m = re.exec(src))) {
        const t = m[0];
        if (t[0] !== '<') { if (t.trim()) tokens.push({ type: 'text', raw: t.trim() }); continue; }
        if (t.slice(0, XML_COMMENT_OPEN.length) === XML_COMMENT_OPEN || /^<!DOCTYPE/i.test(t) || t.slice(0, 2) === '<?' || t.slice(0, XML_CDATA_OPEN.length) === XML_CDATA_OPEN) { tokens.push({ type: 'other', raw: t }); continue; }
        if (t.slice(0, 2) === '</') { tokens.push({ type: 'close', raw: t, name: (/^<\/\s*([a-zA-Z_][\w:.-]*)/.exec(t) || [])[1] }); continue; }
        const selfClose = /\/>\s*$/.test(t);
        const name = (/^<\s*([a-zA-Z_][\w:.-]*)/.exec(t) || [])[1];
        tokens.push({ type: selfClose ? 'selfclose' : 'open', raw: t, name: name });
    }
    const indentUnit = '  ';
    let depth = 0;
    const lines = [];
    let i = 0;
    while (i < tokens.length) {
        const tok = tokens[i];
        if (tok.type === 'other' || tok.type === 'text') { lines.push(indentUnit.repeat(depth) + tok.raw); i++; continue; }
        if (tok.type === 'close') { depth = Math.max(0, depth - 1); lines.push(indentUnit.repeat(depth) + tok.raw); i++; continue; }
        if (tok.type === 'selfclose') { lines.push(indentUnit.repeat(depth) + tok.raw); i++; continue; }
        // open tag
        if (tok.name && XML_VOID_TAGS.has(tok.name.toLowerCase())) { lines.push(indentUnit.repeat(depth) + tok.raw); i++; continue; }
        const next1 = tokens[i + 1], next2 = tokens[i + 2];
        if (next1 && next1.type === 'text' && next2 && next2.type === 'close' && next2.name === tok.name) {
            lines.push(indentUnit.repeat(depth) + tok.raw + next1.raw + next2.raw);
            i += 3; continue;
        }
        if (next1 && next1.type === 'close' && next1.name === tok.name) {
            lines.push(indentUnit.repeat(depth) + tok.raw + next1.raw);
            i += 2; continue;
        }
        lines.push(indentUnit.repeat(depth) + tok.raw);
        depth++; i++;
    }
    return lines.join('\n');
}

// CSS pretty-printer: ignores the source's own line breaks entirely and rebuilds layout purely
// from `{` / `}` / `;` (so minified CSS unpacks the same way hand-formatted CSS gets cleaned up),
// while keeping comments and string contents verbatim.
function formatCSS(code) {
    const src = code.trim();
    if (!src) return code;
    const indentUnit = '  ';
    let depth = 0, i = 0, cur = '';
    const n = src.length;
    const lines = [];
    // isDeclaration: only a `prop:value;`-style line (flushed on `;`, or an unterminated one
    // flushed right before `}`) gets a space forced after its first colon — a selector line like
    // `a:hover {` is flushed via the `{` branch instead and is left alone, so pseudo-classes and
    // pseudo-elements in selectors are never touched.
    function flushLine(isDeclaration) {
        let t = cur.trim();
        if (t) {
            if (isDeclaration) {
                if (t[t.length - 1] !== ';') t += ';';
                const ci = t.indexOf(':');
                if (ci !== -1 && t[ci + 1] !== ' ') t = t.slice(0, ci + 1) + ' ' + t.slice(ci + 1);
            }
            lines.push(indentUnit.repeat(depth) + t);
        }
        cur = '';
    }
    while (i < n) {
        const ch = src[i], nx = src[i + 1];
        if (ch === '/' && nx === '*') {
            const end = src.indexOf('*/', i + 2);
            const block = end === -1 ? src.slice(i) : src.slice(i, end + 2);
            cur += block; i += block.length; continue;
        }
        if (ch === '"' || ch === "'") {
            const quote = ch; let j = i + 1, s = ch;
            while (j < n && src[j] !== quote) { if (src[j] === '\\') { s += src[j] + (src[j + 1] || ''); j += 2; continue; } s += src[j]; j++; }
            s += src[j] || ''; cur += s; i = j + 1; continue;
        }
        if (ch === '{') { cur += cur.trim() ? ' {' : '{'; flushLine(false); depth++; i++; continue; }
        if (ch === '}') { flushLine(true); depth = Math.max(0, depth - 1); lines.push(indentUnit.repeat(depth) + '}'); i++; continue; }
        if (ch === ';') { cur += ';'; flushLine(true); i++; continue; }
        if (/\s/.test(ch)) { if (cur.length && !/\s$/.test(cur)) cur += ' '; i++; continue; }
        cur += ch; i++; continue;
    }
    flushLine(false);
    return lines.join('\n');
}

// SQL formatter: uppercases recognized keywords (outside strings/comments) and breaks the major
// clauses onto their own lines — a lightweight pass, not a real SQL parser.
const SQL_CLAUSE_KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION ALL', 'UNION', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'CREATE INDEX', 'ALTER TABLE', 'DROP TABLE', 'WITH'];
const SQL_UPPER_WORDS = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'ON', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'AS', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'INDEX', 'ALTER', 'DROP', 'WITH', 'DISTINCT', 'ASC', 'DESC', 'BETWEEN', 'LIKE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'];
function formatSQL(code) {
    // Protect string/comment spans, uppercase keywords in the rest, then re-join.
    const parts = code.split(/('(?:[^'\\]|\\.)*'|--[^\n]*|\/\*[\s\S]*?\*\/)/);
    for (let p = 0; p < parts.length; p += 2) {
        parts[p] = parts[p].replace(/\b[A-Za-z]+\b/g, w => SQL_UPPER_WORDS.includes(w.toUpperCase()) ? w.toUpperCase() : w);
    }
    let joined = parts.join('');
    const clausePattern = new RegExp('\\s+(' + SQL_CLAUSE_KEYWORDS.slice().sort((a, b) => b.length - a.length).join('|') + ')\\b', 'g');
    joined = joined.replace(clausePattern, (m, kw) => '\n' + kw);
    return joined.split('\n').map(l => l.trim()).filter((l, idx, arr) => l !== '' || (idx > 0 && arr[idx - 1] !== '')).join('\n').trim();
}

// Same language grouping used to pick a local fallback formatter (below) AND, per-language, to
// decide which languages get a custom Monaco document-formatting-edit-provider registered for
// them (see registerCustomFormatters) — languages Monaco's own bundled build already formats
// natively (TS/JS/CSS/JSON/HTML) are deliberately left out of both.
const BRACE_FORMAT_LANGS = new Set(['typescript', 'javascript', 'java', 'csharp', 'cpp', 'c', 'go', 'rust', 'kotlin', 'swift', 'php', 'objectscript']);
function formatCodeLocally(code, langId) {
    if (!code || !code.trim()) return code;
    try {
        if (langId === 'json') { return JSON.stringify(JSON.parse(code), null, 2); }
        if (langId === 'xml' || langId === 'html') return formatXML(code);
        if (langId === 'css') return formatCSS(code);
        if (langId === 'sql') return formatSQL(code);
        if (BRACE_FORMAT_LANGS.has(langId)) return formatBraceLanguage(code);
    } catch (e) { /* fall through to the safe whitespace tidy below */ }
    return tidyWhitespace(code);
}

/* ---------- tokenizer ---------- */
function buildRegex(rules, flags) {
    const src = rules.map(r => `(?<${r.name}>${r.pattern})`).join('|');
    return new RegExp(src, flags || 'gm');
}
function tokenize(code, rules, flags) {
    if (!rules.length) return [{ text: code, cls: null }];
    const re = buildRegex(rules, flags);
    const clsOf = {};
    rules.forEach(r => clsOf[r.name] = r.cls);
    const tokens = [];
    let last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(code))) {
        if (m.index > last) tokens.push({ text: code.slice(last, m.index), cls: null });
        const name = Object.keys(m.groups).find(k => m.groups[k] !== undefined);
        tokens.push({ text: m[0], cls: clsOf[name] });
        last = m.index + m[0].length;
        if (m[0].length === 0) re.lastIndex++;
    }
    if (last < code.length) tokens.push({ text: code.slice(last), cls: null });
    return tokens;
}
function splitTokensIntoLines(tokens) {
    const lines = [[]];
    tokens.forEach(tok => {
        const parts = tok.text.split('\n');
        parts.forEach((part, i) => {
            if (i > 0) lines.push([]);
            if (part.length) lines[lines.length - 1].push({ text: part, cls: tok.cls });
        });
    });
    return lines;
}
function cFamily(keywords, opts) {
    opts = opts || {};
    const rules = [];
    rules.push({ name: 'comment', pattern: RX.blockComment, cls: 'tok-comment' });
    rules.push({ name: 'linecomment', pattern: RX.lineSlash, cls: 'tok-comment' });
    if (opts.preprocessor) rules.push({ name: 'preproc', pattern: '^[ \\t]*#[a-zA-Z]+[^\\n]*', cls: 'tok-macro' });
    if (opts.decorator) rules.push({ name: 'decorator', pattern: '@[A-Za-z_][\\w.]*', cls: 'tok-type' });
    if (opts.backtick) rules.push({ name: 'bt', pattern: RX.btstr, cls: 'tok-string' });
    rules.push({ name: 'dq', pattern: RX.dqstr, cls: 'tok-string' });
    rules.push({ name: 'sq', pattern: RX.sqstr, cls: 'tok-string' });
    rules.push({ name: 'kw', pattern: kw(keywords), cls: 'tok-keyword' });
    rules.push({ name: 'type', pattern: '\\b[A-Z][A-Za-z0-9_]*\\b', cls: 'tok-type' });
    rules.push({ name: 'func', pattern: '\\b[a-zA-Z_$][\\w$]*(?=\\s*\\()', cls: 'tok-func' });
    rules.push({ name: 'num', pattern: RX.num, cls: 'tok-number' });
    return rules;
}
function pythonRules() {
    return [
        { name: 'triD', pattern: RX.tripleD, cls: 'tok-string' },
        { name: 'triS', pattern: RX.tripleS, cls: 'tok-string' },
        { name: 'comment', pattern: RX.lineHash, cls: 'tok-comment' },
        { name: 'dq', pattern: RX.dqstr, cls: 'tok-string' },
        { name: 'sq', pattern: RX.sqstr, cls: 'tok-string' },
        { name: 'decorator', pattern: '@[A-Za-z_][\\w.]*', cls: 'tok-type' },
        { name: 'kw', pattern: kw(PY_KEYWORDS), cls: 'tok-keyword' },
        { name: 'func', pattern: '\\b[a-zA-Z_][\\w]*(?=\\s*\\()', cls: 'tok-func' },
        { name: 'num', pattern: RX.num, cls: 'tok-number' }
    ];
}
function rubyRules() {
    return [
        { name: 'blockcomment', pattern: '^=begin[\\s\\S]*?^=end[^\\n]*', cls: 'tok-comment' },
        { name: 'comment', pattern: RX.lineHash, cls: 'tok-comment' },
        { name: 'dq', pattern: RX.dqstr, cls: 'tok-string' },
        { name: 'sq', pattern: RX.sqstr, cls: 'tok-string' },
        { name: 'sym', pattern: ':[A-Za-z_]\\w*[?!]?', cls: 'tok-type' },
        { name: 'kw', pattern: kw(RUBY_KEYWORDS), cls: 'tok-keyword' },
        { name: 'func', pattern: '\\b[a-zA-Z_][\\w]*[?!]?(?=\\s*\\()', cls: 'tok-func' },
        { name: 'num', pattern: RX.num, cls: 'tok-number' }
    ];
}
function objectScriptRules() {
    return [
        { name: 'comment', pattern: RX.blockComment, cls: 'tok-comment' },
        { name: 'linecomment', pattern: RX.lineSlash, cls: 'tok-comment' },
        { name: 'macro', pattern: '\\$\\$\\$[A-Za-z_][\\w]*', cls: 'tok-macro' },
        { name: 'sysvar', pattern: '\\$[A-Za-z][\\w]*', cls: 'tok-type' },
        { name: 'sigil', pattern: '%[A-Za-z][\\w]*', cls: 'tok-type' },
        { name: 'dq', pattern: RX.osStr, cls: 'tok-string' },
        { name: 'kw', pattern: kw(OS_KEYWORDS), cls: 'tok-keyword' },
        { name: 'func', pattern: '\\b[a-zA-Z%][\\w]*(?=\\s*\\()', cls: 'tok-func' },
        { name: 'num', pattern: RX.num, cls: 'tok-number' }
    ];
}
function sqlRules() {
    return [
        { name: 'comment', pattern: RX.blockComment, cls: 'tok-comment' },
        { name: 'linecomment', pattern: RX.lineDoubleDash, cls: 'tok-comment' },
        { name: 'sq', pattern: RX.sqstr, cls: 'tok-string' },
        { name: 'kw', pattern: kw(SQL_KEYWORDS), cls: 'tok-keyword' },
        { name: 'num', pattern: RX.num, cls: 'tok-number' }
    ];
}
function shellRules() {
    return [
        { name: 'comment', pattern: RX.lineHash, cls: 'tok-comment' },
        { name: 'dq', pattern: RX.dqstr, cls: 'tok-string' },
        { name: 'sq', pattern: RX.sqstr, cls: 'tok-string' },
        { name: 'varb', pattern: '\\$\\{[^}]*\\}', cls: 'tok-type' },
        { name: 'var', pattern: '\\$[A-Za-z_][\\w]*', cls: 'tok-type' },
        { name: 'kw', pattern: kw(SHELL_KEYWORDS), cls: 'tok-keyword' },
        { name: 'num', pattern: RX.num, cls: 'tok-number' }
    ];
}
function cssRules() {
    return [
        { name: 'comment', pattern: RX.blockComment, cls: 'tok-comment' },
        { name: 'atrule', pattern: '@[a-zA-Z-]+', cls: 'tok-macro' },
        { name: 'dq', pattern: RX.dqstr, cls: 'tok-string' },
        { name: 'sq', pattern: RX.sqstr, cls: 'tok-string' },
        { name: 'hex', pattern: '#[0-9a-fA-F]{3,8}\\b', cls: 'tok-number' },
        { name: 'prop', pattern: '[a-zA-Z-]+(?=\\s*:)', cls: 'tok-key' },
        { name: 'selector', pattern: '[.#][a-zA-Z_][\\w-]*', cls: 'tok-type' },
        { name: 'num', pattern: RX.num, cls: 'tok-number' }
    ];
}
function xmlRules() {
    return [
        { name: 'comment', pattern: ('<!' + '--') + '[\\s\\S]*?' + ('--' + '>'), cls: 'tok-comment' },
        { name: 'doctype', pattern: '<!DOCTYPE[^>]*>', cls: 'tok-macro' },
        { name: 'tagopen', pattern: '</?[a-zA-Z_][\\w:.-]*', cls: 'tok-tag' },
        { name: 'attr', pattern: '[a-zA-Z_:][\\w:.-]*(?==)', cls: 'tok-key' },
        { name: 'dq', pattern: RX.dqstrML, cls: 'tok-string' },
        { name: 'sq', pattern: RX.sqstr, cls: 'tok-string' },
        { name: 'tagclose', pattern: '/?>', cls: 'tok-tag' }
    ];
}
function jsonRules() {
    return [
        { name: 'key', pattern: '"(?:\\\\.|[^"\\\\])*"(?=\\s*:)', cls: 'tok-key' },
        { name: 'str', pattern: RX.dqstrML, cls: 'tok-string' },
        { name: 'kw', pattern: '\\b(?:true|false|null)\\b', cls: 'tok-keyword' },
        { name: 'num', pattern: RX.num, cls: 'tok-number' }
    ];
}
function yamlRules() {
    return [
        { name: 'comment', pattern: RX.lineHash, cls: 'tok-comment' },
        { name: 'key', pattern: '^[ \\t]*[\\w.-]+(?=\\s*:)', cls: 'tok-key' },
        { name: 'dq', pattern: RX.dqstr, cls: 'tok-string' },
        { name: 'sq', pattern: RX.sqstr, cls: 'tok-string' },
        { name: 'kw', pattern: '\\b(?:true|false|null|yes|no)\\b', cls: 'tok-keyword' },
        { name: 'num', pattern: RX.num, cls: 'tok-number' }
    ];
}
const GRAMMARS = {
    typescript: () => cFamily(TS_KEYWORDS, { decorator: true, backtick: true }),
    javascript: () => cFamily(JS_KEYWORDS, { decorator: true, backtick: true }),
    java: () => cFamily(JAVA_KEYWORDS, { decorator: true }),
    csharp: () => cFamily(CSHARP_KEYWORDS, { decorator: true }),
    cpp: () => cFamily(CPP_KEYWORDS, { preprocessor: true }),
    c: () => cFamily(C_KEYWORDS, { preprocessor: true }),
    go: () => cFamily(GO_KEYWORDS, { backtick: true }),
    rust: () => cFamily(RUST_KEYWORDS, { decorator: true }),
    kotlin: () => cFamily(KOTLIN_KEYWORDS, { decorator: true }),
    swift: () => cFamily(SWIFT_KEYWORDS, { decorator: true }),
    php: () => cFamily(PHP_KEYWORDS, {}),
    python: pythonRules,
    ruby: rubyRules,
    objectscript: objectScriptRules,
    sql: sqlRules,
    shell: shellRules,
    css: cssRules,
    xml: xmlRules,
    html: xmlRules,
    json: jsonRules,
    yaml: yamlRules,
    plaintext: () => []
};
const GRAMMAR_FLAGS = { sql: 'gim' };
// HTML is the one language whose grammar isn't a flat token set — the markup around <script> and
// <style> is plain tags/attributes (xmlRules), but their CONTENTS are a different language entirely
// (JS / CSS) and need that language's own rules, or things like CSS's `"Segoe UI", "SF Mono"` font
// stacks get scanned by xmlRules' generic quoted-string matcher with no per-declaration boundaries:
// a stray/odd quote pairing anywhere in the block can "run on" and swallow many following lines into
// one big incorrectly-colored string. Segmenting out each <script>/<style> block and tokenizing its
// inner text with the real JS/CSS grammar (same as Monaco's own embedded-language highlighting) is
// what keeps our view-mode colors matching Monaco's edit-mode colors for HTML files.
const HTML_EMBED_RE = /<(script|style)\b([^>]*)>([\s\S]*?)(<\/\1\s*>)/gi;
function highlightHtmlToLines(code) {
    let tokens = [];
    let last = 0;
    HTML_EMBED_RE.lastIndex = 0;
    let m;
    while ((m = HTML_EMBED_RE.exec(code))) {
        const matchStart = m.index;
        const matchEnd = matchStart + m[0].length;
        const innerText = m[3];
        const closeTagText = m[4];
        // Reconstruct the exact opening-tag substring (attrs and all) by trimming the known
        // inner/close text off the end of the full match, rather than re-deriving indices —
        // keeps this independent of regex "indices" (the /d flag) for broader compatibility.
        const openTagText = m[0].slice(0, m[0].length - innerText.length - closeTagText.length);
        if (matchStart > last) tokens = tokens.concat(tokenize(code.slice(last, matchStart), xmlRules(), 'gm'));
        tokens = tokens.concat(tokenize(openTagText, xmlRules(), 'gm'));
        if (innerText.length) {
            const innerRules = m[1].toLowerCase() === 'style' ? cssRules() : GRAMMARS.javascript();
            tokens = tokens.concat(tokenize(innerText, innerRules, 'gm'));
        }
        tokens = tokens.concat(tokenize(closeTagText, xmlRules(), 'gm'));
        last = matchEnd;
        if (m[0].length === 0) HTML_EMBED_RE.lastIndex++;
    }
    if (last < code.length) tokens = tokens.concat(tokenize(code.slice(last), xmlRules(), 'gm'));
    return splitTokensIntoLines(tokens);
}
function highlightToLines(code, langId) {
    if (langId === 'html') return highlightHtmlToLines(code);
    const builder = GRAMMARS[langId] || GRAMMARS.plaintext;
    const rules = builder();
    const flags = GRAMMAR_FLAGS[langId] || 'gm';
    const tokens = tokenize(code, rules, flags);
    return splitTokensIntoLines(tokens);
}
function escapeHtml(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

/* ---------- bracket-pair colorization (view mode) ----------
   Monaco colors matching ( ), [ ], { } pairs by nesting depth out of the box; our hand-rolled
   view-mode renderer had no equivalent, so brackets all rendered in the plain default text color.
   This walks the already-tokenized lines (skipping anything already classified as a string or
   comment, exactly like computeFoldRanges' own brace-matching pass does) and re-splits each
   remaining plain-text run so individual bracket characters become their own token, colored by
   a 3-color cycle keyed to nesting depth — the same "Gold / Orchid / Light-sky-blue" cycle VS
   Code/Monaco uses by default. A stack (shared across all three bracket kinds, matching Monaco's
   default behavior) pairs each closer with its opener so both get the same color; a closer with
   nothing left to pair against is marked unmatched rather than guessed at. */
const BRACKET_COLOR_CLASSES = ['brk-1', 'brk-2', 'brk-3'];
function annotateBracketColors(lines) {
    const stack = [];
    return lines.map(lineTokens => {
        const outLine = [];
        lineTokens.forEach(tok => {
            if (tok.cls === 'tok-string' || tok.cls === 'tok-comment' || !/[{}()\[\]]/.test(tok.text)) {
                outLine.push(tok);
                return;
            }
            let buf = '';
            for (let i = 0; i < tok.text.length; i++) {
                const ch = tok.text[i];
                if (ch === '(' || ch === '[' || ch === '{') {
                    if (buf) { outLine.push({ text: buf, cls: tok.cls }); buf = ''; }
                    const colorCls = BRACKET_COLOR_CLASSES[stack.length % BRACKET_COLOR_CLASSES.length];
                    stack.push(colorCls);
                    outLine.push({ text: ch, cls: colorCls });
                } else if (ch === ')' || ch === ']' || ch === '}') {
                    if (buf) { outLine.push({ text: buf, cls: tok.cls }); buf = ''; }
                    const colorCls = stack.pop();
                    outLine.push({ text: ch, cls: colorCls || 'brk-unmatched' });
                } else {
                    buf += ch;
                }
            }
            if (buf) outLine.push({ text: buf, cls: tok.cls });
        });
        return outLine;
    });
}

/* ---------- code folding: detect foldable ranges (functions/methods/blocks/labels) ---------- */
const FOLD_BRACE_LANGS = new Set(['typescript','javascript','java','csharp','cpp','c','go','rust','kotlin','swift','php','css','json','objectscript']);
function foldIndentWidth(line) {
    const m = /^[ \t]*/.exec(line)[0];
    let w = 0;
    for (const c of m) w += (c === '\t') ? 4 : 1;
    return w;
}
function computeFoldRanges(code, langId) {
    const rawLines = code.split('\n');
    const n = rawLines.length;
    if (n < 2) return [];
    const ranges = [];
    const startsUsed = new Set();

    // Brace/bracket matching (skips braces inside strings/comments via the tokenizer's own classification)
    if (FOLD_BRACE_LANGS.has(langId)) {
        const tokenLines = highlightToLines(code, langId);
        const stack = [];
        let braceRanges = [];
        tokenLines.forEach((lineTokens, li) => {
            lineTokens.forEach(tok => {
                if (tok.cls === 'tok-string' || tok.cls === 'tok-comment') return;
                for (let ci = 0; ci < tok.text.length; ci++) {
                    const ch = tok.text[ci];
                    if (ch === '{' || ch === '[') stack.push({ ch, line: li });
                    else if (ch === '}' || ch === ']') {
                        const open = stack.pop();
                        if (open && li > open.line) braceRanges.push({ start: open.line, end: li });
                    }
                }
            });
        });
        // Allman-style formatting puts the opening brace alone on its own line (e.g. ObjectScript
        // Class/ClassMethod bodies). Re-anchor those ranges to the declaration line above so the
        // fold arrow and sticky-scroll header show "ClassMethod Foo(...)" rather than a bare "{".
        braceRanges = braceRanges.map(r => {
            startsUsed.add(r.start); // block the indentation pass from also claiming the bare-brace line
            const braceOnly = /^[ \t]*[{[]+[ \t]*$/.test(rawLines[r.start]);
            if (!braceOnly) return r;
            let back = r.start - 1;
            while (back >= 0 && rawLines[back].trim() === '') back--;
            return back >= 0 ? { start: back, end: r.end } : r;
        });
        ranges.push(...braceRanges);
        ranges.forEach(r => startsUsed.add(r.start));
    }

    // Indentation-based folding — the primary mechanism for Python/Ruby/label-style routines
    // (e.g. ObjectScript .mac routines), and a supplement everywhere else.
    const isBlank = rawLines.map(l => l.trim().length === 0);
    const indents = rawLines.map(foldIndentWidth);
    for (let i = 0; i < n; i++) {
        if (isBlank[i] || startsUsed.has(i)) continue;
        let j = i + 1;
        while (j < n && isBlank[j]) j++;
        if (j >= n || indents[j] <= indents[i]) continue;
        let end = i, k = j;
        while (k < n) {
            if (isBlank[k]) { k++; continue; }
            if (indents[k] > indents[i]) { end = k; k++; }
            else break;
        }
        if (end > i) { ranges.push({ start: i, end }); startsUsed.add(i); }
    }

    // Dedupe by start line, keeping the outermost (largest-span) range for that line.
    const byStart = new Map();
    ranges.forEach(r => {
        if (!byStart.has(r.start) || byStart.get(r.start).end < r.end) byStart.set(r.start, r);
    });
    return Array.from(byStart.values()).sort((a, b) => a.start - b.start);
}

/* ---------- Myers diff ----------
   Same algorithm as before (Myers O(ND) shortest-edit-script), just backed by a flat
   Int32Array instead of a plain object keyed by (often negative) diagonal indices `k`.
   The old `v[k]` object forced V8 into slow "dictionary mode" (negative/sparse integer
   keys can't use the fast array-index path) and re-cloned that dictionary on every step
   via Object.assign -- both the per-access cost and the per-step clone cost disappear
   with a typed array, which is why this is ~15-20x faster on the same inputs while
   producing byte-for-byte identical output (verified against the old implementation). */
function myersDiff(a, b) {
    const n = a.length, m = b.length;
    if (n === 0 && m === 0) return [];
    const max = n + m;
    const offset = max; // maps diagonal k (range -max..max) onto a valid array index
    const v = new Int32Array(2 * max + 1);
    const trace = [];
    outer:
    for (let d = 0; d <= max; d++) {
        trace.push(v.slice());
        for (let k = -d; k <= d; k += 2) {
            let x;
            if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) x = v[offset + k + 1];
            else x = v[offset + k - 1] + 1;
            let y = x - k;
            while (x < n && y < m && a[x] === b[y]) { x++; y++; }
            v[offset + k] = x;
            if (x >= n && y >= m) break outer;
        }
    }
    let x = n, y = m;
    const ops = [];
    for (let d = trace.length - 1; d >= 0; d--) {
        const v2 = trace[d];
        const k = x - y;
        let prevK;
        if (k === -d || (k !== d && v2[offset + k - 1] < v2[offset + k + 1])) prevK = k + 1;
        else prevK = k - 1;
        const prevX = v2[offset + prevK];
        const prevY = prevX - prevK;
        while (x > prevX && y > prevY) { ops.push({ type: 'equal', aIdx: x - 1, bIdx: y - 1 }); x--; y--; }
        if (d > 0) {
            if (x === prevX) { ops.push({ type: 'add', bIdx: y - 1 }); y--; }
            else { ops.push({ type: 'remove', aIdx: x - 1 }); x--; }
        }
    }
    return ops.reverse();
}
function groupDiff(ops) {
    const groups = [];
    let i = 0;
    while (i < ops.length) {
        if (ops[i].type === 'equal') { groups.push(ops[i]); i++; continue; }
        const removes = [], adds = [];
        while (i < ops.length && ops[i].type === 'remove') { removes.push(ops[i]); i++; }
        while (i < ops.length && ops[i].type === 'add') { adds.push(ops[i]); i++; }
        const pairCount = Math.min(removes.length, adds.length);
        for (let k = 0; k < pairCount; k++) groups.push({ type: 'changed', removeOp: removes[k], addOp: adds[k] });
        for (let k = pairCount; k < removes.length; k++) groups.push(removes[k]);
        for (let k = pairCount; k < adds.length; k++) groups.push(adds[k]);
    }
    return groups;
}
function charDiff(sA, sB) {
    if (sA.length + sB.length > 500) return null; // too long, skip inline char diff
    const a = Array.from(sA), b = Array.from(sB);
    if (a.length * b.length > 20000) return null;
    const ops = myersDiff(a, b);
    return groupDiff(ops).map(g => {
        if (g.type === 'equal') return { type: 'equal', text: a[g.aIdx] };
        if (g.type === 'changed') return [{ type: 'remove', text: a[g.removeOp.aIdx] }, { type: 'add', text: b[g.addOp.bIdx] }];
        if (g.type === 'remove') return { type: 'remove', text: a[g.aIdx] };
        return { type: 'add', text: b[g.bIdx] };
    }).flat();
}
function escapeAttr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function debounce(fn, wait) { let t; return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); }; }
