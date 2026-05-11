import type { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import type { Agent, Coordinator, MultiAgentDslAstType, Summarizer } from './generated/ast.js';
import type { MultiAgentDslServices } from './multi-agent-dsl-module.js';
import { modelsFor } from './models.js';

export function registerValidationChecks(services: MultiAgentDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MultiAgentDslValidator;
    const checks: ValidationChecks<MultiAgentDslAstType> = {
        Agent: validator.checkAgentModel,
        Coordinator: validator.checkCoordinatorModel,
        Summarizer: validator.checkSummarizerModel,
    };
    registry.register(checks, validator);
}

// Cualquier nodo construido con el fragment ProviderModel comparte estos campos.
type ProviderModelNode = AstNode & { provider: string; model: string };

function checkProviderModel(node: ProviderModelNode, kind: string, accept: ValidationAcceptor): void {
    const allowed = modelsFor(node.provider);
    if (allowed.length === 0 || allowed.includes(node.model)) {
        return;
    }
    accept(
        'error',
        `Modelo "${node.model}" no válido para provider "${node.provider}" en ${kind}. Modelos válidos: ${allowed.join(', ')}.`,
        { node, property: 'model' }
    );
}

export class MultiAgentDslValidator {

    checkAgentModel(agent: Agent, accept: ValidationAcceptor): void {
        checkProviderModel(agent, 'agent', accept);
    }

    checkCoordinatorModel(coordinator: Coordinator, accept: ValidationAcceptor): void {
        checkProviderModel(coordinator, 'coordinator', accept);
    }

    checkSummarizerModel(summarizer: Summarizer, accept: ValidationAcceptor): void {
        checkProviderModel(summarizer, 'summarizer', accept);
    }
}
