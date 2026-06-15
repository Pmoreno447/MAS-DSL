import * as vscode from 'vscode';
import * as os from 'node:os';
import * as path from 'node:path';
import { URI } from 'langium';
import { NodeFileSystem } from 'langium/node';
import type { LLMMultiAgentSystem, MultiAgentDslServices } from 'multi-agent-dsl-language';
import { createMultiAgentDslServices } from 'multi-agent-dsl-language';
import { modelToMermaid } from './mermaid.js';

let services: MultiAgentDslServices | undefined;
let output: vscode.OutputChannel | undefined;

function log(msg: string): void {
    if (!output) {
        output = vscode.window.createOutputChannel('multiAgentDSL Preview');
    }
    output.appendLine(msg);
}

// Instancia propia de Langium reutilizada entre refrescos del diagrama.
function getServices(): MultiAgentDslServices {
    if (!services) {
        services = createMultiAgentDslServices(NodeFileSystem).MultiAgentDsl;
    }
    return services;
}

// Parsea el .mad y devuelve su diagrama Mermaid (o un mensaje de error).
async function buildDiagram(filePath: string): Promise<string> {
    const svc = getServices();
    const uri = URI.file(filePath);
    const docs = svc.shared.workspace.LangiumDocuments;
    if (docs.hasDocument(uri)) {
        docs.deleteDocument(uri);
    }
    const document = await docs.getOrCreateDocument(uri);
    await svc.shared.workspace.DocumentBuilder.build([document], { validation: true });

    const errors = (document.diagnostics ?? []).filter(d => d.severity === 1);
    if (errors.length > 0) {
        return `flowchart TD\n  err["⚠ El modelo tiene ${errors.length} error(es)"]`;
    }
    const model = document.parseResult.value as LLMMultiAgentSystem;
    return modelToMermaid(model);
}

// Archivo .md temporal con el bloque mermaid, que abre el preview de Markdown de VSCode.
const MD_PATH = path.join(os.tmpdir(), 'multiAgentDSL-preview.md');

async function generateMarkdown(document: vscode.TextDocument): Promise<void> {
    const diagram = await buildDiagram(document.uri.fsPath);
    log('Diagrama generado:\n' + diagram);
    const md = `# Diagrama: ${path.basename(document.fileName)}\n\n` +
        '```mermaid\n' + diagram + '\n```\n';
    await vscode.workspace.fs.writeFile(vscode.Uri.file(MD_PATH), Buffer.from(md, 'utf8'));
    log('Markdown escrito en ' + MD_PATH);
}

/** Comando "Ver diagrama": genera un .md con el diagrama y lo abre en el preview de Markdown. */
export async function previewCommand(_context: vscode.ExtensionContext): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'multi-agent-dsl') {
        vscode.window.showErrorMessage('Abre un archivo .mad para ver el diagrama.');
        return;
    }
    log('previewCommand ejecutado para ' + editor.document.uri.fsPath);
    try {
        await generateMarkdown(editor.document);
        await vscode.commands.executeCommand('markdown.showPreviewToSide', vscode.Uri.file(MD_PATH));
    } catch (e) {
        const msg = e instanceof Error ? (e.stack ?? e.message) : String(e);
        log('ERROR:\n' + msg);
        vscode.window.showErrorMessage('Error al generar el diagrama: ' + (e instanceof Error ? e.message : String(e)));
    }
}

/** Refresca el diagrama al guardar un .mad si el preview ya se ha abierto. */
export function registerPreviewRefresh(_context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.workspace.onDidSaveTextDocument(async document => {
        if (document.languageId !== 'multi-agent-dsl') return;
        try { await vscode.workspace.fs.stat(vscode.Uri.file(MD_PATH)); } catch { return; }
        try {
            await generateMarkdown(document);
        } catch (e) {
            log('ERROR al refrescar: ' + (e instanceof Error ? e.message : String(e)));
        }
    });
}
