import * as vscode from 'vscode';

function nonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 32; i++) { s += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return s;
}

export function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const media = (f: string) => webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', f));
    const n = nonce();
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${n}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${media('main.css')}">
<title>Dev Toolkit</title>
</head>
<body>
<div id="app"></div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script nonce="${n}" src="${media('core.js')}"></script>
<script nonce="${n}" src="${media('main.js')}"></script>
</body>
</html>`;
}
