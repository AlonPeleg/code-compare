import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { SendPayload } from './detect';
import { getWebviewHtml } from './webviewHtml';

export class DevToolkitPanel {
    public static readonly viewType = 'devToolkit';
    public static current: DevToolkitPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private ready = false;
    private queue: any[] = [];
    private disposables: vscode.Disposable[] = [];

    /** Opens (or reveals) the panel in a split to the side of the editor. */
    public static createOrShow(extensionUri: vscode.Uri, preserveFocus: boolean): DevToolkitPanel {
        if (DevToolkitPanel.current) {
            DevToolkitPanel.current.panel.reveal(undefined, preserveFocus);
            return DevToolkitPanel.current;
        }
        const panel = vscode.window.createWebviewPanel(
            DevToolkitPanel.viewType,
            'Dev Toolkit',
            { viewColumn: vscode.ViewColumn.Beside, preserveFocus },
            DevToolkitPanel.webviewOptions(extensionUri)
        );
        DevToolkitPanel.current = new DevToolkitPanel(panel, extensionUri);
        return DevToolkitPanel.current;
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        panel.webview.options = DevToolkitPanel.webviewOptions(extensionUri);
        DevToolkitPanel.current = new DevToolkitPanel(panel, extensionUri);
    }

    /** Sends editor content to the panel, opening it if needed. */
    public static send(extensionUri: vscode.Uri, payload: SendPayload) {
        const reveal = vscode.workspace.getConfiguration('devToolkit').get<boolean>('revealOnSend', true);
        let p = DevToolkitPanel.current;
        if (!p) {
            p = DevToolkitPanel.createOrShow(extensionUri, true);
        } else if (reveal && !p.panel.visible) {
            p.panel.reveal(undefined, true);
        }
        p.post({ type: 'add', ...payload });
    }

    private static webviewOptions(extensionUri: vscode.Uri): vscode.WebviewPanelOptions & vscode.WebviewOptions {
        return {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        };
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.panel.iconPath = vscode.Uri.joinPath(extensionUri, 'media', 'icon.png');
        this.panel.webview.html = getWebviewHtml(this.panel.webview, extensionUri);
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(m => this.onMessage(m), null, this.disposables);
    }

    public post(message: any) {
        if (this.ready) { this.panel.webview.postMessage(message); }
        else { this.queue.push(message); }
    }

    public pushSettings() {
        const cfg = vscode.workspace.getConfiguration('devToolkit');
        this.panel.webview.postMessage({ type: 'settings', jsonIndent: cfg.get<number>('jsonIndent', 2) });
    }

    private async onMessage(m: any) {
        switch (m?.type) {
            case 'ready': {
                this.ready = true;
                this.pushSettings();
                const pending = this.queue;
                this.queue = [];
                pending.forEach(msg => this.panel.webview.postMessage(msg));
                break;
            }
            case 'copy': {
                await vscode.env.clipboard.writeText(String(m.text ?? ''));
                vscode.window.setStatusBarMessage(`$(check) Dev Toolkit: ${m.label || 'Copied'}`, 2000);
                break;
            }
            case 'save':
                await this.saveFile(String(m.text ?? ''), String(m.fileName || 'snippet'), String(m.ext || 'txt'));
                break;
            case 'openInEditor': {
                const doc = await vscode.workspace.openTextDocument({ content: String(m.text ?? ''), language: m.language || 'plaintext' });
                await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One, preview: false });
                break;
            }
            case 'info':
                vscode.window.showInformationMessage(`Dev Toolkit: ${m.text}`);
                break;
            case 'error':
                vscode.window.showErrorMessage(`Dev Toolkit: ${m.text}`);
                break;
        }
    }

    private async saveFile(text: string, fileName: string, ext: string) {
        const safe = fileName.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').replace(/^_+|_+$/g, '') || 'snippet';
        const full = safe.toLowerCase().endsWith('.' + ext.toLowerCase()) ? safe : `${safe}.${ext}`;
        const baseDir = vscode.workspace.workspaceFolders?.[0]?.uri
            ?? vscode.Uri.file(path.join(os.homedir(), 'Desktop'));
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.joinPath(baseDir, full),
            saveLabel: 'Download',
            filters: { [ext.toUpperCase()]: [ext], 'All files': ['*'] }
        });
        if (!uri) { return; }
        await vscode.workspace.fs.writeFile(uri, Buffer.from(text, 'utf8'));
        const choice = await vscode.window.showInformationMessage(`Dev Toolkit: saved ${path.basename(uri.fsPath)}`, 'Open');
        if (choice === 'Open') { await vscode.window.showTextDocument(uri, { viewColumn: vscode.ViewColumn.One }); }
    }


    private dispose() {
        DevToolkitPanel.current = undefined;
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
