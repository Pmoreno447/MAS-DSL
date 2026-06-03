import type { LangiumDocument, MaybePromise } from 'langium';
import { AstUtils, CstUtils, GrammarAST } from 'langium';
import { CompletionAcceptor, CompletionContext, DefaultCompletionProvider, NextFeature } from 'langium/lsp';
import type { CancellationToken } from 'vscode-languageserver';
import { CompletionItemKind, CompletionList } from 'vscode-languageserver';
import type { CompletionParams } from 'vscode-languageserver';
import { isAgent, isCoordinator, isSummarizer } from './generated/ast.js';
import { modelsFor } from './models.js';

type ActorWithProvider = { provider: string };

export class MultiAgentDslCompletionProvider extends DefaultCompletionProvider {

    override readonly completionOptions = {
        triggerCharacters: [' ', '"']
    };

    override async getCompletion(
        document: LangiumDocument,
        params: CompletionParams,
        cancelToken?: CancellationToken
    ): Promise<CompletionList | undefined> {
        const stringContext = this.findModelStringContext(document, params);
        if (stringContext) {
            const { provider, replaceStart, replaceEnd } = stringContext;
            return {
                isIncomplete: false,
                items: modelsFor(provider).map(model => ({
                    label: model,
                    kind: CompletionItemKind.Value,
                    detail: `modelo de ${provider}`,
                    textEdit: {
                        range: {
                            start: document.textDocument.positionAt(replaceStart),
                            end: document.textDocument.positionAt(replaceEnd)
                        },
                        newText: model
                    }
                }))
            };
        }
        return super.getCompletion(document, params, cancelToken);
    }

    private findModelStringContext(
        document: LangiumDocument,
        params: CompletionParams
    ): { provider: string; replaceStart: number; replaceEnd: number } | undefined {
        const cst = document.parseResult.value.$cstNode;
        if (!cst) return undefined;
        const offset = document.textDocument.offsetAt(params.position);
        const leaf = CstUtils.findLeafNodeAtOffset(cst, offset) ?? CstUtils.findLeafNodeBeforeOffset(cst, offset);
        if (!leaf) return undefined;
        const text = leaf.text;
        const isStringLiteral = text.length >= 2 && (text.startsWith('"') || text.startsWith("'"));
        if (!isStringLiteral) return undefined;
        const assignment = AstUtils.getContainerOfType(leaf.grammarSource, GrammarAST.isAssignment);
        if (!assignment || assignment.feature !== 'model') return undefined;
        const node = leaf.astNode;
        if (!(isAgent(node) || isCoordinator(node) || isSummarizer(node))) return undefined;
        const provider = (node as unknown as ActorWithProvider).provider;
        if (!provider) return undefined;
        return {
            provider,
            replaceStart: leaf.offset + 1,
            replaceEnd: leaf.end - 1
        };
    }

    protected override completionFor(
        context: CompletionContext,
        next: NextFeature,
        acceptor: CompletionAcceptor
    ): MaybePromise<void> {
        const feature = next.feature;
        if (
            GrammarAST.isAssignment(feature) &&
            feature.feature === 'model' &&
            context.node && (isAgent(context.node) || isCoordinator(context.node) || isSummarizer(context.node))
        ) {
            const provider = (context.node as unknown as ActorWithProvider).provider;
            if (provider) {
                for (const model of modelsFor(provider)) {
                    acceptor(context, {
                        label: model,
                        kind: CompletionItemKind.Value,
                        insertText: `"${model}"`,
                        detail: `modelo de ${provider}`
                    });
                }
            }
            return;
        }
        return super.completionFor(context, next, acceptor);
    }
}
