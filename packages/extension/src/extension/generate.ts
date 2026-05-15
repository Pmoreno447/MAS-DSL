import * as vscode from 'vscode';
import * as path from 'node:path';
import { URI } from 'langium';
import { NodeFileSystem } from 'langium/node';
import type { LLMMultiAgentSystem } from 'multi-agent-dsl-language';
import { createMultiAgentDslServices } from 'multi-agent-dsl-language';
import { generate } from 'multi-agent-dsl-cli';

/**
 * Comando "Generar código LangGraph": parsea el .mad activo, comprueba que no
 * tenga errores y genera el código Python en una carpeta `generated/` al lado
 * del fichero. Al terminar abre el `graph.py` resultante.
 */
export async function generateCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'multi-agent-dsl') {
        vscode.window.showErrorMessage('Abre un archivo .mad para generar el código.');
        return;
    }

    // Guardar el fichero para que el generador lea la última versión.
    await editor.document.save();
    const filePath = editor.document.uri.fsPath;

    // Parsear y validar con una instancia propia de Langium (NodeFileSystem).
    const services = createMultiAgentDslServices(NodeFileSystem).MultiAgentDsl;
    const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(
        URI.file(filePath)
    );
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });

    const errors = (document.diagnostics ?? []).filter(d => d.severity === 1);
    if (errors.length > 0) {
        vscode.window.showErrorMessage(
            `El modelo tiene ${errors.length} error(es). Corrígelos antes de generar.`
        );
        return;
    }

    const model = document.parseResult.value as LLMMultiAgentSystem;
    const destination = path.join(path.dirname(filePath), 'generated');

    try {
        generate(model, filePath, destination);
    } catch (e) {
        vscode.window.showErrorMessage(
            `Error al generar el código: ${e instanceof Error ? e.message : String(e)}`
        );
        return;
    }

    vscode.window.showInformationMessage(`Código LangGraph generado en ${destination}`);

    // Abrir el grafo generado si existe.
    try {
        const graphDoc = await vscode.workspace.openTextDocument(
            vscode.Uri.file(path.join(destination, 'graph.py'))
        );
        await vscode.window.showTextDocument(graphDoc);
    } catch {
        // graph.py puede no existir según el modelo; no es un error.
    }
}
