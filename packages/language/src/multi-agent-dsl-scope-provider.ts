import { AstNodeDescription, AstUtils, DefaultScopeProvider, ReferenceInfo, Scope, MapScope } from 'langium';
import { isLLMMultiAgentSystem, type LLMMultiAgentSystem } from './generated/ast.js';

export class MultiAgentDslScopeProvider extends DefaultScopeProvider {

    override getScope(context: ReferenceInfo): Scope {
        // Atributos: solo dentro del contexto del sistema actual
        if (context.property === 'stateContext' || context.property === 'stateUpdate' || context.property === 'attribute') {
            const system = AstUtils.getContainerOfType(context.container, isLLMMultiAgentSystem) as LLMMultiAgentSystem | undefined;
            if (system?.context) {
                const descriptions = system.context.attributes.map(attr =>
                    this.descriptions.createDescription(attr, attr.name)
                );
                return new MapScope(descriptions);
            }
        }

        // Para el resto: recorrer el documento actual y quedarnos con los nodos
        // del tipo que la referencia espera (p. ej. Profile, Agent, ...).
        const referenceType = this.reflection.getReferenceType(context);
        const root = AstUtils.getDocument(context.container).parseResult.value;
        const descriptions: AstNodeDescription[] = [];
        for (const node of AstUtils.streamAllContents(root)) {
            if (this.reflection.isInstance(node, referenceType)) {
                const name = this.nameProvider.getName(node);
                if (name) {
                    descriptions.push(this.descriptions.createDescription(node, name));
                }
            }
        }
        return new MapScope(descriptions);
    }
}
