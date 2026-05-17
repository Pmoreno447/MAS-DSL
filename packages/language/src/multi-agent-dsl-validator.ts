import type { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import { Agent, CommTransition, Context, Coordinator, isBoolLiteral, isIntLiteral, isMCPServer, isStringLiteral, Layered, LLMMultiAgentSystem, MultiAgentDslAstType, Summarizer } from './generated/ast.js';
import type { MultiAgentDslServices } from './multi-agent-dsl-module.js';
import { modelsFor } from './models.js';

// PARA COMPROBAR LAS RESTRICCIONES IMPLEMENTADAS REVISAR "docs/restricciones.md

export function registerValidationChecks(services: MultiAgentDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MultiAgentDslValidator;
    const checks: ValidationChecks<MultiAgentDslAstType> = {
        Agent: [validator.checkAgentModel, validator.checkAgentTemperature, validator.checkAgentPositiveValues],
        Coordinator: [validator.checkCoordinatorModel, validator.checkCoordinatorTemperature],
        Summarizer: [validator.checkSummarizerModel, validator.checkSummarizerTemperature, validator.checkSummarizerPositiveValues],
        Context: validator.checkContextPositiveValues,
        Layered: validator.checkLayeredNoCycles,
        LLMMultiAgentSystem: [validator.checkCommunicationStructuresConnected, validator.checkMcpServer, validator.checkMcpApiKeyUnique, validator.uniqueStartPoint, validator.checkDuplicatedArcs, validator.checkUniqueTransition, validator.checkTransitionCompatibility, validator.checkSummarizerUnique, validator.checkUniqueNames],
        CommTransition: validator.checkConditionTypeCompatibility,
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

type TemperatureNode = AstNode & { name: string; temperature?: number };

function checkPositive(node: AstNode, field: string, value: number | undefined, accept: ValidationAcceptor): void {
    if (value !== undefined && value <= 0) {
        accept('error', `"${field}" debe ser mayor que 0.`, { node, code: 'R10' ,property: field });
    }
}

function checkTemperature(node: TemperatureNode, accept: ValidationAcceptor): void {
    if (node.temperature !== undefined && (node.temperature < 0.0 || node.temperature > 1.0)) {
        accept('error', `La temperatura de "${node.name}" debe estar entre 0.0 y 1.0.`, { node, code: 'R08', property: 'temperature' });
    }
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


    // R01: Estructuras de comunicación conectadas
    checkCommunicationStructuresConnected(system: LLMMultiAgentSystem, accept: ValidationAcceptor): void {
        for (const structure of system.communicationStructures) {
            const isConnected = system.transitions.some(t =>
                t.source?.ref === structure || t.target?.ref === structure
            );
            if (!isConnected) {
                accept('error', `La estructura "${structure.name}" no está conectada a ninguna transición.`, { node: structure, code: 'R01' });
            }
        }
    }

    // R02: URL única por MCPServer
    checkMcpServer(system: LLMMultiAgentSystem, accept: ValidationAcceptor): void {
        const mcpServers = system.tools.filter(isMCPServer);
        for (const server of mcpServers) {
            const isDuplicated = mcpServers.some(s => s.url === server.url && s !== server);
            if (isDuplicated) {
                accept('error', `URL duplicada "${server.url}" en MCPServer "${server.name}".`, { node: server, code: 'R02' , property: 'url' });
            }
        }
    }

    // R03: Punto de inicio único
    uniqueStartPoint(system: LLMMultiAgentSystem, accept: ValidationAcceptor): void {
        const starts = system.transitions.filter(t => t.isStart);
        if (starts.length === 0) {
            accept('error', 'Debe existir exactamente una transición START.', { node: system, code: 'R03' });
        } else if (starts.length > 1) {
            for (const t of starts) {
                accept('error', 'Solo puede haber un START en el sistema.', { node: t, code: 'R03' });
            }
        } else if (starts[0].isEnd) {
            accept('error', 'La transición START no puede ir directamente a END: incluye al menos una estructura de comunicación en el modelo.', { node: starts[0], code: 'R03' });
        }
    }

    // R04: Sin arcos duplicados con condición desde el mismo origen
    checkDuplicatedArcs(system: LLMMultiAgentSystem, accept: ValidationAcceptor): void {
        const conditioned = system.transitions.filter(t => t.condition && t.source && t.target);
        for (const t of conditioned) {
            const isDuplicated = conditioned.some(other =>
                other !== t &&
                other.source?.ref === t.source?.ref &&
                other.target?.ref === t.target?.ref
            );
            if (isDuplicated) {
                accept('error', `Arco duplicado desde "${t.source!.ref!.name}" hacia "${t.target!.ref!.name}".`, { node: t, code: 'R04' });
            }
        }
    }

    // R05: Transiciones únicas sin condición
    checkUniqueTransition(system: LLMMultiAgentSystem, accept: ValidationAcceptor): void {
        for (const t of system.transitions.filter(t => t.condition && t.source)) {
            const siblings = system.transitions.filter(other => other.source?.ref === t.source?.ref);
            if (siblings.length === 1) {
                accept('error', `La única transición desde "${t.source!.ref!.name}" no puede llevar condición.`, { node: t, code: 'R05' ,property: 'condition' });
            }
        }
    }

    // R06: Compatibilidad de tipos en la condición de transición
    checkConditionTypeCompatibility(transition: CommTransition, accept: ValidationAcceptor): void {
        if (!transition.condition) return;
        const { attribute, value } = transition.condition;
        const attrType = attribute.ref?.type;
        if (!attrType) return;

        const mismatch =
            (attrType === 'int'     && !isIntLiteral(value))    ||
            (attrType === 'string'  && !isStringLiteral(value)) ||
            (attrType === 'boolean' && !isBoolLiteral(value));

        if (mismatch) {
            accept('error', `El tipo del valor no coincide con el tipo "${attrType}" del atributo "${attribute.ref!.name}".`, { node: transition.condition, code: 'R06' , property: 'value' });
        }
    }

    // R07: Como máximo una transición sin condición por origen
    checkTransitionCompatibility(system: LLMMultiAgentSystem, accept: ValidationAcceptor): void {
        const sources = new Set(system.transitions.filter(t => t.source).map(t => t.source!.ref));
        for (const source of sources) {
            const siblings = system.transitions.filter(t => t.source?.ref === source);
            const unconditioned = siblings.filter(t => !t.condition);
            if (unconditioned.length > 1) {
                for (const t of unconditioned) {
                    accept('error', `Solo puede haber una transición sin condición desde "${source!.name}".`, { node: t, code: 'R07' });
                }
            }
        }
    }

    // R08: Temperatura entre 0.0 y 1.0
    checkAgentTemperature(agent: Agent, accept: ValidationAcceptor): void {
        checkTemperature(agent, accept);
    }

    checkCoordinatorTemperature(coordinator: Coordinator, accept: ValidationAcceptor): void {
        checkTemperature(coordinator, accept);
    }

    checkSummarizerTemperature(summarizer: Summarizer, accept: ValidationAcceptor): void {
        checkTemperature(summarizer, accept);
    }

    // R09: Un solo Summarizer en el sistema
    checkSummarizerUnique(system: LLMMultiAgentSystem, accept: ValidationAcceptor): void {
        if (system.actors.filter(a => a.$type === 'Summarizer').length > 1) {
            for (const s of system.actors.filter(a => a.$type === 'Summarizer')) {
                accept('error', 'Solo puede existir un Summarizer en el sistema.', { node: s, code: 'R09' });
            }
        }
    }

    /*
    R10: Valores positivos de:
        - maxToken: Agent
        - timeOut: Agent
        - maxRetries: Agent
        - tokenTrigger: Summarizer
        - maxMessages: Context
    */
    checkAgentPositiveValues(agent: Agent, accept: ValidationAcceptor): void {
        checkPositive(agent, 'maxToken', agent.maxToken, accept);
        checkPositive(agent, 'timeOut', agent.timeOut, accept);
        checkPositive(agent, 'maxRetries', agent.maxRetries, accept);
    }

    checkSummarizerPositiveValues(summarizer: Summarizer, accept: ValidationAcceptor): void {
        checkPositive(summarizer, 'tokenTrigger', summarizer.tokenTrigger, accept);
    }

    checkContextPositiveValues(context: Context, accept: ValidationAcceptor): void {
        checkPositive(context, 'maxMessages', context.maxMessages, accept);
    }

    // R11: Layered sin ciclos
    checkLayeredNoCycles(layered: Layered, accept: ValidationAcceptor): void {
        const visited = new Set<string>();
        for (const startLayer of layered.layers) {
            const startName = startLayer.agent?.ref?.name;
            if (!startName || visited.has(startName)) continue;
            const path = new Set<string>();
            path.add(startName);
            let currentAgent = startLayer.next?.ref;
            while (currentAgent) {
                if (path.has(currentAgent.name)) {
                    const cycleLayer = layered.layers.find(l => l.agent?.ref === currentAgent);
                    if (cycleLayer) {
                        accept('error', `Ciclo detectado en "${layered.name}": el agente "${currentAgent.name}" forma un ciclo.`, { node: cycleLayer, code: 'R11',property: 'next' });
                    }
                    break;
                }
                path.add(currentAgent.name);
                visited.add(currentAgent.name);
                const nextLayer = layered.layers.find(l => l.agent?.ref === currentAgent);
                currentAgent = nextLayer?.next?.ref;
            }
        }
    }

    // R12: apiKeyName única por MCPServer
    checkMcpApiKeyUnique(system: LLMMultiAgentSystem, accept: ValidationAcceptor): void {
        const withKey = system.tools.filter(isMCPServer).filter(s => s.apiKeyName);
        for (const server of withKey) {
            const isDuplicated = withKey.some(s => s.apiKeyName === server.apiKeyName && s !== server);
            if (isDuplicated) {
                accept('error', `apiKeyName duplicada "${server.apiKeyName}" en MCPServer "${server.name}".`, { node: server, code: 'R12', property: 'apiKeyName' });
            }
        }
    }

    // R13: Nombres únicos en todo el sistema (espacio de nombres global)
    checkUniqueNames(system: LLMMultiAgentSystem, accept: ValidationAcceptor): void {
        const named: (AstNode & { name: string })[] = [
            system.context,
            ...system.context.attributes,
            ...system.profiles,
            ...system.tools,
            ...system.actors,
            ...system.communicationStructures,
        ];

        const counts = new Map<string, number>();
        for (const node of named) {
            counts.set(node.name, (counts.get(node.name) ?? 0) + 1);
        }

        for (const node of named) {
            if (counts.get(node.name)! > 1) {
                accept('error', `El nombre "${node.name}" está duplicado: cada elemento del sistema debe tener un nombre único.`, { node, property: 'name', code: 'R13' });
            }
        }
    }
}
