import type { LLMMultiAgentSystem, Agent, Decentralized } from 'multi-agent-dsl-language';
import { isMCPServer, isPythonTool, isAgent, isDecentralized, isCentralized, isSummarizer } from 'multi-agent-dsl-language';
import { expandToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName, toPythonType, toModel, generateNodeName, collectAgentToolNames } from '../util.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isUsingTools(model: LLMMultiAgentSystem): boolean {
    return model.tools.length > 0;
}

function hasAnyStatusMessage(model: LLMMultiAgentSystem): boolean {
    return model.actors.filter(isAgent).some(a => !!a.statusMessage);
}

function streamWriterImport(model: LLMMultiAgentSystem): string {
    return hasAnyStatusMessage(model)
        ? 'from langgraph.config import get_stream_writer'
        : '';
}

function getDecentralizedCluster(agent: Agent, model: LLMMultiAgentSystem): Decentralized | null {
    for (const s of model.communicationStructures) {
        if (isDecentralized(s) && s.agents.some(ref => ref.ref === agent)) return s;
    }
    return null;
}

function clusterMemberNodeNames(cluster: Decentralized): string[] {
    return cluster.agents.map(ref => ref.ref!).map(a => a.name.toLowerCase());
}

function hasAnyDecentralizedAgent(model: LLMMultiAgentSystem): boolean {
    return model.actors.filter(isAgent).some(a => getDecentralizedCluster(a, model) !== null);
}

// True si el agente pertenece a una estructura centralizada. Sus mensajes se
// etiquetan con `name` para que el coordinador identifique quién ya actuó.
function isInCentralizedCluster(agent: Agent, model: LLMMultiAgentSystem): boolean {
    return model.communicationStructures.some(
        s => isCentralized(s) && s.agents.some(ref => ref.ref === agent)
    );
}

function generateStructuredOutput(agent: Agent, model: LLMMultiAgentSystem): string {
    const cluster = getDecentralizedCluster(agent, model);
    const isDecentral = cluster !== null;
    const hasStateUpdate = !!(agent.stateUpdate && agent.stateUpdate.length > 0);

    if (!isDecentral && !hasStateUpdate) return '';

    const className = agent.name.charAt(0).toUpperCase() + agent.name.slice(1) + 'Output';
    const fields: string[] = [];

    const toolNames = collectAgentToolNames(agent);
    const hasTools = toolNames.length > 0;

    if (isDecentral) {
        // Sin tools la respuesta del agente solo existe en este schema, así que
        // se incluye `message` para poder volcarla a state["messages"]. Con tools
        // la respuesta ya es el AIMessage del tool-call y no hace falta.
        if (!hasTools) {
            fields.push(`    message: str = Field(description="Tu respuesta al usuario.")`);
        }
        const members = clusterMemberNodeNames(cluster!);
        const literal = [...members.map(n => `"${n}"`), '"END"'].join(', ');
        fields.push(`    next: Literal[${literal}] = Field(description="Próximo nodo al que delegar dentro del cluster decentralized; END para terminar.")`);
    }

    if (hasStateUpdate) {
        for (const ref of agent.stateUpdate!) {
            fields.push(`    ${ref.ref!.name}: ${toPythonType(ref.ref!.type)} = Field(description="${ref.ref!.description}")`);
        }
    }
    const docstring = hasTools
        ? `    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""\n`
        : '';

    return `class ${className}(BaseModel):\n${docstring}${fields.join('\n')}`;
}

function generateModel(agent: Agent, model: LLMMultiAgentSystem): string {
    const variableName = 'model' + agent.name.charAt(0).toUpperCase() + agent.name.slice(1);
    const className = agent.name.charAt(0).toUpperCase() + agent.name.slice(1) + 'Output';

    const params: string[] = [
        `model="${toModel(agent)}"`,
        `temperature=${agent.temperature ?? 0.0}`,
    ];
    if (agent.provider === 'ollama') params.push(`base_url=OLLAMA_BASE_URL`);
    if (agent.maxToken)   params.push(`max_tokens=${agent.maxToken}`);
    if (agent.timeOut)    params.push(`timeout=${agent.timeOut}`);
    if (agent.maxRetries) params.push(`max_retries=${agent.maxRetries}`);

    let line = `${variableName} = init_chat_model(${params.join(', ')})`;

    const toolNames = collectAgentToolNames(agent);
    const hasTools = toolNames.length > 0;
    const isDecentral = getDecentralizedCluster(agent, model) !== null;
    // En decentralized el schema con `next` debe generarse aunque no haya stateUpdate.
    const hasStructured = !!(agent.stateUpdate && agent.stateUpdate.length > 0) || isDecentral;

    // BaseModel-as-tool: cuando hay tools y schema estructurado, el schema de salida
    // se bindea como una tool más. El modelo lo invoca cuando ha "terminado"
    // y el while-loop del nodo extrae los args como salida estructurada.
    if (hasTools && hasStructured) {
        line += `.bind_tools([${[...toolNames, className].join(', ')}], tool_choice="required")`;
    } else if (hasTools) {
        line += `.bind_tools([${toolNames.join(', ')}])`;
    } else if (hasStructured) {
        line += `.with_structured_output(${className})`;
    }

    return line;
}

function generateNode(agent: Agent, model: LLMMultiAgentSystem): string {
    const agentPascal = agent.name.charAt(0).toUpperCase() + agent.name.slice(1);
    const nodeName = generateNodeName(agent);
    const modelName = `model${agentPascal}`;
    const profileName = agent.profile.ref!.name.toUpperCase();
    const description = agent.description ?? '';
    const className = agentPascal + 'Output';

    const contextFields = agent.stateContext && agent.stateContext.length > 0
        ? `+ [HumanMessage(content=f"""
${agent.stateContext.map(ref => `            ${ref.ref!.name}: {state.get("${ref.ref!.name}", "No registrado aún")}`).join('\n')}
        """)]`
        : '';

    const toolNames = collectAgentToolNames(agent);
    const hasTools = toolNames.length > 0;
    const hasStateUpdate = !!(agent.stateUpdate && agent.stateUpdate.length > 0);
    const cluster = getDecentralizedCluster(agent, model);
    const isDecentral = cluster !== null;
    const hasStructured = hasStateUpdate || isDecentral;
    const inCentralized = isInCentralizedCluster(agent, model);

    // Con estrategia de resumen el profile se envuelve en `_system_prompt`, que
    // antepone el resumen acumulado del estado.
    const hasSummary = model.actors.some(isSummarizer);
    const systemArg = hasSummary ? `_system_prompt(${profileName}, state)` : profileName;

    const statusLine = agent.statusMessage
        ? `    get_stream_writer()({"status": "${agent.statusMessage}"})\n`
        : '';

    // Anotación de retorno para nodos decentralized: Command[Literal[<miembros>, "__end__"]]
    const gotoTypeLiteral = isDecentral
        ? [...clusterMemberNodeNames(cluster!).map(n => `"${n}"`), '"__end__"'].join(', ')
        : '';
    const returnAnnotation = isDecentral ? ` -> Command[Literal[${gotoTypeLiteral}]]` : '';

    // ── Rama decentralized sin tools ─────────────────────────────────────────
    if (isDecentral && !hasTools) {
        // La respuesta del agente se vuelca a state["messages"] con su nombre,
        // así el resto de nodos y la UI ven lo que produjo cada agente.
        const updateLines: string[] = [
            `        "messages": [AIMessage(content=result.message, name="${agent.name.toLowerCase()}")]`,
        ];
        if (hasStateUpdate) {
            for (const ref of agent.stateUpdate!) {
                updateLines.push(`        "${ref.ref!.name}": result.${ref.ref!.name}`);
            }
        }
        const updateBlock = `{\n${updateLines.join(',\n')}\n    }`;

        return `def ${nodeName}(state: State)${returnAnnotation}:
    """${description}"""
${statusLine}    result = ${modelName}.invoke(
        [SystemMessage(content=${systemArg})]
        + state["messages"]
        ${contextFields}
    )
    goto = END if result.next == "END" else result.next
    return Command(goto=goto, update=${updateBlock})`;
    }

    // ── Rama decentralized con tools ─────────────────────────────────────────
    // Schema-como-tool obligatorio (tool_choice="required") con `next` siempre y
    // los campos de stateUpdate si los hay. Al invocarse, cerramos el loop y
    // emitimos Command(goto, update).
    if (isDecentral && hasTools) {
        const stateUpdateExtraction = hasStateUpdate
            ? agent.stateUpdate!.map(ref =>
                `                    "${ref.ref!.name}": tc["args"]["${ref.ref!.name}"]`
              ).join(',\n')
            : '';
        const updateBody = hasStateUpdate
            ? `{\n                    "messages": [response],\n${stateUpdateExtraction}\n                }`
            : `{"messages": [response]}`;

        return `async def ${nodeName}(state: State)${returnAnnotation}:
    """${description}"""
    messages = (
        [SystemMessage(content=${systemArg})]
        + state["messages"]
        ${contextFields}
    )
    while True:
        response = await ${modelName}.ainvoke(messages)
        messages.append(response)
        for tc in response.tool_calls:
            if tc["name"] == "${className}":
                goto = END if tc["args"]["next"] == "END" else tc["args"]["next"]
                return Command(goto=goto, update=${updateBody})
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))`;
    }

    // ── Rama sin tools (no decentralized): patrón síncrono clásico. ──────────
    if (!hasTools) {
        // En centralized se etiqueta el mensaje con el nombre del agente para
        // que el coordinador sepa quién ya actuó.
        const nameLine = inCentralized ? `result.name = "${agent.name.toLowerCase()}"\n    ` : '';
        const returnBlock = hasStructured
            ? `return {\n${agent.stateUpdate!.map(ref =>
                `        "${ref.ref!.name}": result.${ref.ref!.name}`
              ).join(',\n')}\n    }`
            : `${nameLine}return {"messages": [result]}`;

        return `def ${nodeName}(state: State):
    """${description}"""
${statusLine}    result = ${modelName}.invoke(
        [SystemMessage(content=${systemArg})]
        + state["messages"]
        ${contextFields}
    )
    ${returnBlock}`;
    }

    // ── Rama con tools (no decentralized): async + while-loop. ──────────────
    const terminalBlock = hasStructured
        ? `        for tc in response.tool_calls:
            if tc["name"] == "${className}":
                return {\n${agent.stateUpdate!.map(ref =>
                    `                    "${ref.ref!.name}": tc["args"]["${ref.ref!.name}"]`
                  ).join(',\n')}\n                }
`
        : '';

    return `async def ${nodeName}(state: State):
    """${description}"""
    messages = (
        [SystemMessage(content=${systemArg})]
        + state["messages"]
        ${contextFields}
    )
    while True:
        response = await ${modelName}.ainvoke(messages)
        messages.append(response)
        if not response.tool_calls:
${inCentralized ? `            response.name = "${agent.name.toLowerCase()}"\n` : ''}            return {"messages": [response]}
${terminalBlock}        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))`;
}

// ─── Generator ────────────────────────────────────────────────────────────────
export function agentsGenerator(model: LLMMultiAgentSystem, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, 'agents')}.py`;
    const agents = model.actors.filter(isAgent);

    const messageImports = isUsingTools(model)
        ? 'from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage'
        : 'from langchain_core.messages import SystemMessage, HumanMessage, AIMessage';

    const hasDecentralized = hasAnyDecentralizedAgent(model);
    const hasStructuredOutputs = hasDecentralized || agents.some(
        agent => agent.stateUpdate && agent.stateUpdate.length > 0
    );

    const usesOllama = agents.some(agent => agent.provider === 'ollama');

    const mcpToolNames = model.tools.filter(isMCPServer).flatMap(s => s.tools);
    const mcpImport = mcpToolNames.length > 0
        ? `from tools.mcpClients import ${mcpToolNames.join(', ')}`
        : '';
    const pythonToolImports = model.tools
        .filter(isPythonTool)
        .map(pt => `from tools.${pt.modulePath} import ${pt.name}`)
        .join('\n');

    const profileNames = model.profiles.map(p => p.name.toUpperCase()).join(', ');

    const structuredOutputs = agents
        .map(a => generateStructuredOutput(a, model))
        .filter(s => s !== '')
        .join('\n\n');

    const models = agents
        .map(a => generateModel(a, model))
        .join('\n');

    const nodes = agents
        .map(a => generateNode(a, model))
        .join('\n\n');

    // Dict de despacho de tools para el while-loop en nodos async.
    const allToolNames = [
        ...mcpToolNames,
        ...model.tools.filter(isPythonTool).map(pt => pt.name),
    ];
    const toolsByName = isUsingTools(model)
        ? `_tools_by_name = {t.name: t for t in [${allToolNames.join(', ')}]}`
        : '';

    const decentralizedImports = hasDecentralized
        ? 'from langgraph.types import Command\nfrom langgraph.graph import END\nfrom typing import Literal'
        : '';

    // Helper que antepone el resumen acumulado (campo `summary` del estado) al
    // profile del agente. Solo se emite si el sistema usa estrategia de resumen.
    const hasSummary = model.actors.some(isSummarizer);
    const summaryHelper = hasSummary
        ? `def _system_prompt(profile: str, state) -> str:
    """Antepone el resumen acumulado de la conversación (si existe) al profile."""
    resumen = state.get("summary")
    if resumen:
        return f"{profile}\\n\\nContexto previo resumido:\\n{resumen}"
    return profile`
        : '';

    const fileNode = expandToNode`
# agents.py
${messageImports}
from prompt import ${profileNames}
from state import State
from langchain.chat_models import init_chat_model
${streamWriterImport(model)}
${decentralizedImports}
${usesOllama ? 'from config import OLLAMA_BASE_URL' : ''}
${hasStructuredOutputs ? 'from pydantic import BaseModel, Field' : ''}
${mcpImport}
${pythonToolImports}

# Salidas de los nodos
${structuredOutputs}

# Modelos
${models}

${toolsByName}

${summaryHelper}

# Nodos del grafo
${nodes}
`.appendNewLineIfNotEmpty();

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}
