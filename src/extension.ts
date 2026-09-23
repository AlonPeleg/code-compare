import * as vscode from 'vscode';
import * as path from 'path';
import { DevToolkitPanel } from './panel';
import { buildPayload } from './detect';

export function activate(context: vscode.ExtensionContext) {
    // ---- Status bar button (bottom bar) ----
    const statusBarItem = vscode.window.createStatusBarItem('devToolkit.status', vscode.StatusBarAlignment.Left, 100);
    statusBarItem.name = 'Dev Toolkit';
    statusBarItem.command = 'devToolkit.open';
    statusBarItem.text = '$(tools) Dev Toolkit';
    statusBarItem.tooltip = 'Open Dev Toolkit (Code & JSON viewer / compare)';
    const syncStatusBar = () => {
        const show = vscode.workspace.getConfiguration('devToolkit').get<boolean>('showStatusBarButton', true);
        show ? statusBarItem.show() : statusBarItem.hide();
    };
    syncStatusBar();

    context.subscriptions.push(
        statusBarItem,
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('devToolkit.showStatusBarButton')) { syncStatusBar(); }
            if (e.affectsConfiguration('devToolkit.jsonIndent')) { DevToolkitPanel.current?.pushSettings(); }
        }),

        vscode.commands.registerCommand('devToolkit.open', () => {
            DevToolkitPanel.createOrShow(context.extensionUri, false);
        }),

        vscode.commands.registerCommand('devToolkit.sendSelection', () => sendFromEditor(context, false)),
        vscode.commands.registerCommand('devToolkit.sendSelectionToCompare', () => sendFromEditor(context, true)),

        vscode.commands.registerCommand('devToolkit.sendFile', async (uri?: vscode.Uri) => {
            if (!uri) { return; }
            try {
                const bytes = await vscode.workspace.fs.readFile(uri);
                const text = Buffer.from(bytes).toString('utf8');
                if (!text.trim()) {
                    vscode.window.showWarningMessage('Dev Toolkit: the file is empty.');
                    return;
                }
                const fileName = path.basename(uri.fsPath);
                const payload = buildPayload(text, undefined, fileName, fileName, false);
                DevToolkitPanel.send(context.extensionUri, payload);
            } catch (err: any) {
                vscode.window.showErrorMessage('Dev Toolkit: could not read file — ' + (err?.message ?? err));
            }
        })
    );

    // Restore the panel after a window reload.
    vscode.window.registerWebviewPanelSerializer(DevToolkitPanel.viewType, {
        async deserializeWebviewPanel(panel: vscode.WebviewPanel) {
            DevToolkitPanel.revive(panel, context.extensionUri);
        }
    });
}

function sendFromEditor(context: vscode.ExtensionContext, toCompare: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Dev Toolkit: open a file and select some code first.');
        return;
    }
    const doc = editor.document;
    const selections = editor.selections.filter(s => !s.isEmpty);
    const fileName = doc.isUntitled ? 'Untitled' : path.basename(doc.fileName);

    let text: string;
    let name: string;
    if (selections.length === 0) {
        // Nothing selected -> send the whole document.
        text = doc.getText();
        name = fileName;
    } else {
        const sorted = [...selections].sort((a, b) => a.start.compareTo(b.start));
        text = sorted.map(s => doc.getText(s)).join('\n');
        const first = sorted[0].start.line + 1;
        const last = sorted[sorted.length - 1].end.line + 1;
        name = first === last ? `${fileName}:${first}` : `${fileName}:${first}-${last}`;
    }

    if (!text.trim()) {
        vscode.window.showInformationMessage('Dev Toolkit: nothing to send — the selection is empty.');
        return;
    }

    const payload = buildPayload(text, doc.languageId, doc.isUntitled ? undefined : doc.fileName, name, toCompare);
    DevToolkitPanel.send(context.extensionUri, payload);
}

export function deactivate() { /* nothing to clean up */ }
