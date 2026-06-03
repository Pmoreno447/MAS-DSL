import * as vscode from 'vscode';
import * as path from 'node:path';

export async function helpCommand(context: vscode.ExtensionContext): Promise<void> {
    const helpPath = context.asAbsolutePath(path.join('help.md'));
    await vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(helpPath));
}
