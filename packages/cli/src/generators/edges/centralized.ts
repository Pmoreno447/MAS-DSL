import type { Centralized, Coordinator, Agent } from 'multi-agent-dsl-language';
import { expandToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateNodeName, subgraphDefinitionName } from '../../util.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function collectStateFields(agents: Agent[]): Map<string, { name: string; description: string }> {
    const fields = new Map<string, { name: string; description: string }>();
    for (const agent of agents) {
        for (const ref of (agent.stateUpdate ?? [])) {
            const attr = ref.ref!;
            if (!fields.has(attr.name)) {
                fields.set(attr.name, { name: attr.name, description: attr.description });
            }
        }
    }
    return fields;
}

function generateRouterClass(memberNames: string[]): string {
    const literal = [...memberNames.map(n => `"${n}"`), '"FINISH"'].join(', ');
    return `class Router(TypedDict):
    next: Literal[${literal}]`;
}

function generateCoordinatorModel(coordinator: Coordinator): string {
    const params: string[] = [
        `model="${coordinator.provider}:${coordinator.model}"`,
        `temperature=${coordinator.temperature ?? 0.0}`,
    ];
    if (coordinator.provider === 'ollama') params.push(`base_url=OLLAMA_BASE_URL`);
    return `modelCoordinator = init_chat_model(${params.join(', ')})`;
}

// Sección de estado embebida en el f-string del coordinador. Vacía si el
// sistema no declara atributos de estado.
function generateStateSection(stateFields: Map<string, { name: string; description: string }>): string {
    if (stateFields.size === 0) return '';
    const lines = [...stateFields.values()]
        .map(f => `        - ${f.name} (${f.description}): {state.get("${f.name}", "No registrado aún")}`)
        .join('\n');
    return `

Estado actual del sistema:
${lines}`;
}

// Helper Python que serializa el historial a texto etiquetado por autor. El
// coordinador lo usa para decidir el routing sin participar en el chat: así el
// input que recibe el modelo termina siempre en un turno humano (requisito de
// Anthropic) y funciona igual en todos los providers.
const FORMAT_CONVERSATION_HELPER = `def _format_conversation(messages) -> str:
    """Serializa el historial a texto etiquetado por autor."""
    lineas = []
    for m in messages:
        autor = getattr(m, "name", None) or m.type
        contenido = m.content if isinstance(m.content, str) else str(m.content)
        if contenido:
            lineas.append(f"- {autor}: {contenido}")
    return "\\n".join(lineas) if lineas else "(sin mensajes todavía)"`;

function generateRoutingPreambleConstant(memberNames: string[]): string {
    const agentList = memberNames.map(n => `- "${n}"`).join('\n');
    return `COORDINADOR_ENRUTAMIENTO = """
Debes responder siempre con un objeto JSON con un único campo "next".
Los valores válidos para "next" son:
${agentList}
- "FINISH"

Reglas:
- Delega al agente más adecuado para gestionar la solicitud.
- Delega a UN SOLO especialista por turno.
- El bloque "Estado actual del sistema" muestra los campos del estado compartido que los especialistas escriben tras actuar; úsalos para saber si una tarea ya está resuelta y, en ese caso, responde "FINISH".
- No delegues al mismo agente dos veces para la misma solicitud.

"""`;
}

function generateCoordinatorNode(coordinator: Coordinator, memberNames: string[], stateSection: string): string {
    const profileName = coordinator.profile.ref!.name.toUpperCase();
    const returnLiteral = [...memberNames.map(n => `"${n}"`), '"__end__"'].join(', ');
    return `def coordinator_node(state: State) -> Command[Literal[${returnLiteral}]]:
    # El coordinador no participa en el chat: recibe la conversación como texto
    # dentro de un único HumanMessage. El input termina siempre en turno humano.
    resumen = state.get("summary")
    bloque_resumen = f"Resumen de la conversación previa:\\n{resumen}\\n\\n" if resumen else ""
    contexto = f"""
{bloque_resumen}Conversación hasta ahora:
{_format_conversation(state["messages"])}${stateSection}

Decide el siguiente paso: delega al agente adecuado o responde "FINISH" si la tarea ya está resuelta.
"""
    messages = [
        SystemMessage(content=COORDINADOR_ENRUTAMIENTO + ${profileName}),
        HumanMessage(content=contexto),
    ]
    response = modelCoordinator.with_structured_output(Router).invoke(messages)
    goto = END if response["next"] == "FINISH" else response["next"]
    return Command(goto=goto)`;
}

function generateSupervisorGraph(centralized: Centralized): string {
    const agents = centralized.agents.map(a => a.ref!);
    const definitionName = subgraphDefinitionName(centralized);

    const addNodes = agents
        .map(a => `    builder.add_node("${a.name.toLowerCase()}", ${generateNodeName(a)})`)
        .join('\n');
    const addEdges = agents
        .map(a => `    builder.add_edge("${a.name.toLowerCase()}", "coordinator")`)
        .join('\n');

    return `def ${definitionName}():
    builder = StateGraph(State)

    builder.add_node("coordinator", coordinator_node)
${addNodes}

    builder.add_edge(START, "coordinator")
${addEdges}

    return builder.compile()`;
}

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateCentralizedSubgraph(centralized: Centralized, destination: string): string {
    const subgraphDir = path.join(destination, 'subgraph');
    const filePath = path.join(subgraphDir, `${centralized.name}.py`);

    const coordinator = centralized.coordinator.ref!;
    const agents = centralized.agents.map(a => a.ref!);
    const stateFields = collectStateFields(agents);
    const memberNames = agents.map(a => a.name.toLowerCase());
    const profileName = coordinator.profile.ref!.name.toUpperCase();

    const routerClass        = generateRouterClass(memberNames);
    const coordinatorModel   = generateCoordinatorModel(coordinator);
    const stateSection       = generateStateSection(stateFields);
    const coordinatorNode    = generateCoordinatorNode(coordinator, memberNames, stateSection);
    const supervisorGraph    = generateSupervisorGraph(centralized);
    const nodeImports        = agents.map(a => generateNodeName(a)).join(', ');
    const usesOllama         = coordinator.provider === 'ollama';
    const routingPreamble    = generateRoutingPreambleConstant(memberNames);

    const fileNode = expandToNode`
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command
from typing import Literal, TypedDict
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.chat_models import init_chat_model
from state import State
from prompt import ${profileName}
from agents import ${nodeImports}
${usesOllama ? 'from config import OLLAMA_BASE_URL' : ''}

${routingPreamble}

${routerClass}

${coordinatorModel}

${FORMAT_CONVERSATION_HELPER}

${coordinatorNode}

${supervisorGraph}
`.appendNewLineIfNotEmpty();

    if (!fs.existsSync(subgraphDir)) {
        fs.mkdirSync(subgraphDir, { recursive: true });
    }
    fs.writeFileSync(filePath, toString(fileNode));
    return filePath;
}
