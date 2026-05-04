import { isTrim, isMix, isSummarize, type Trim, type Mix, type None, type Summarize } from 'multi-agent-dsl-language';

// ─── Interfaz ────────────────────────────────────────────────────────────────
//
// La estrategia de mensajes puede aportar código a tres archivos del paquete
// `state/`:
//   - state/state.py       → solo el TypedDict
//   - state/reducers.py    → reducers / nodo de resumen / helpers
//   - state/__init__.py    → re-exporta para que `from state import X` siga
//                            funcionando como antes
export interface MessageConfig {
    // state/state.py
    stateImports: string;     // imports adicionales para el TypedDict (puede estar vacío)
    field: string;            // declaración del campo `messages`

    // state/reducers.py — puede estar vacío para la estrategia "none"
    reducersImports: string;
    reducersBody: string;

    // Nombres a re-exportar desde state/__init__.py (ej: trim_messages_reducer,
    // summary_node, should_summarize). State siempre se re-exporta.
    exports: string[];
}

// ─── Bloques compartidos ──────────────────────────────────────────────────────

const TRIM_REDUCER_BODY =
`def trim_messages_reducer(max_messages: int):
    """
    Devuelve un reducer que mantiene solo los últimos max_messages mensajes,
    conservando siempre el primero.
    """
    def reducer(current: list, new: list) -> list:
        updated = add_messages(current, new)
        if len(updated) > max_messages:
            return [updated[0]] + updated[-(max_messages - 1):]
        return updated
    return reducer`;

const TRIM_REDUCER_IMPORTS = 'from langgraph.graph.message import add_messages';

function buildSummaryNode(provider: string, model: string): string {
    return `llm = init_chat_model("${provider}:${model}")

def _content_to_text(content) -> str:
    """Normaliza content a string. Maneja content-as-list (multimodal/tool calls)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(
            part.get("text", "") for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        )
    return ""

def _count_tokens(messages: list[BaseMessage]) -> int:
    # tiktoken con encoding de OpenAI como aproximación universal (ver ADR 011).
    encoder = tiktoken.encoding_for_model("gpt-4o")
    return sum(len(encoder.encode(_content_to_text(m.content))) for m in messages)

def _safe_split_index(messages: list[BaseMessage]) -> int:
    """Índice del último HumanMessage. Lo anterior es seguro de borrar
    sin romper pares AIMessage(tool_calls) ↔ ToolMessage del turno en curso."""
    for i in range(len(messages) - 1, -1, -1):
        if messages[i].type == "human":
            return i
    return 0

def _format_for_prompt(messages: list[BaseMessage]) -> str:
    return "\\n".join(f"{m.type}: {_content_to_text(m.content)}" for m in messages)

# Sin anotación de tipo en 'state': LangGraph llama get_type_hints() en los
# nodos/routers y un forward-ref a State requeriría importarlo en runtime,
# lo que crearía un ciclo state.py <-> reducers.py en la estrategia MIX.
def should_summarize(state) -> str:
    return "summary_node" if _count_tokens(state["messages"]) > MAX_TOKENS else END

async def summary_node(state):
    messages = state["messages"]
    split = _safe_split_index(messages)

    # Mensajes a comprimir vs. mensajes a conservar literales (turno en curso).
    to_compress = messages[:split]
    to_keep = messages[split:]

    existing_summary = next(
        (m.content for m in to_compress if getattr(m, "name", None) == "__summary__"),
        None
    )
    new_messages = [m for m in to_compress if getattr(m, "name", None) != "__summary__"]

    # Piso: si no hay nada nuevo que comprimir, no hagas nada.
    if not new_messages:
        return {"messages": []}

    formatted = _format_for_prompt(new_messages)

    if existing_summary:
        prompt = (
            "Actualiza el siguiente resumen estructurado integrando los nuevos mensajes. "
            "Conserva la estructura por secciones y no descartes hechos previos relevantes.\\n\\n"
            f"Resumen previo:\\n{_content_to_text(existing_summary)}\\n\\n"
            f"Nuevos mensajes:\\n{formatted}\\n\\n"
            "Devuelve el resumen actualizado con estas secciones:\\n"
            "- Objetivos del usuario\\n"
            "- Decisiones tomadas\\n"
            "- Hechos establecidos\\n"
            "- Pendientes"
        )
    else:
        prompt = (
            "Resume la siguiente conversación de forma estructurada. "
            "Sé conciso pero no pierdas información operativa.\\n\\n"
            f"Conversación:\\n{formatted}\\n\\n"
            "Devuelve el resumen con estas secciones:\\n"
            "- Objetivos del usuario\\n"
            "- Decisiones tomadas\\n"
            "- Hechos establecidos\\n"
            "- Pendientes"
        )

    new_summary = await llm.ainvoke(prompt)
    summary_text = _content_to_text(new_summary.content)

    to_delete = [RemoveMessage(id=m.id) for m in to_compress if m.id is not None]

    return {
        "messages": [
            *to_delete,
            SystemMessage(content=summary_text, name="__summary__"),
        ]
    }`;
}

const SUMMARY_IMPORTS_BASE =
`from langchain_core.messages import SystemMessage, RemoveMessage, BaseMessage
from langchain.chat_models import init_chat_model
from langgraph.graph import END
import tiktoken`;

// ─── Plantillas ───────────────────────────────────────────────────────────────

const TRIM: MessageConfig = {
    stateImports: 'from state.reducers import trim_messages_reducer\nfrom config import MAX_MESSAGES',
    field: 'messages: Annotated[list, trim_messages_reducer(MAX_MESSAGES)]',
    reducersImports: TRIM_REDUCER_IMPORTS,
    reducersBody: TRIM_REDUCER_BODY,
    exports: ['trim_messages_reducer'],
};

function buildSummarize(s: Summarize): MessageConfig {
    return {
        stateImports: 'from langgraph.graph.message import add_messages',
        field: 'messages: Annotated[list, add_messages]',
        reducersImports: `${SUMMARY_IMPORTS_BASE}\nfrom config import MAX_TOKENS`,
        reducersBody: buildSummaryNode(s.provider, s.model),
        exports: ['should_summarize', 'summary_node'],
    };
}

function buildMix(m: Mix): MessageConfig {
    return {
        stateImports: 'from state.reducers import trim_messages_reducer\nfrom config import MAX_MESSAGES',
        field: 'messages: Annotated[list, trim_messages_reducer(MAX_MESSAGES)]',
        reducersImports: `${SUMMARY_IMPORTS_BASE}\n${TRIM_REDUCER_IMPORTS}\nfrom config import MAX_TOKENS`,
        reducersBody: `${TRIM_REDUCER_BODY}\n\n${buildSummaryNode(m.provider, m.model)}`,
        exports: ['trim_messages_reducer', 'should_summarize', 'summary_node'],
    };
}

const NONE: MessageConfig = {
    stateImports: 'from langgraph.graph.message import add_messages',
    field: 'messages: Annotated[list, add_messages]',
    reducersImports: '',
    reducersBody: '',
    exports: [],
};

// ─── Resolver ─────────────────────────────────────────────────────────────────

export function resolveMessageConfig(message: Trim | Mix | None | Summarize | undefined): MessageConfig {
    if (isTrim(message))      return TRIM;
    if (isSummarize(message)) return buildSummarize(message);
    if (isMix(message))       return buildMix(message);
    return NONE;
}

// ─── Inyección de nodo terminal en el grafo ───────────────────────────────────
// Estrategias que añaden un nodo al final del grafo (resumen, mix) exponen
// símbolos re-exportados en state/__init__.py que el graphGenerator inserta
// sin saber qué estrategia es.
export interface TerminalNodeInjection {
    routerFn: string;
    nodeName: string;
    stateImports: string[];
}

export function resolveTerminalNode(
    message: Trim | Mix | None | Summarize | undefined
): TerminalNodeInjection | null {
    if (isSummarize(message) || isMix(message)) {
        return {
            routerFn: 'should_summarize',
            nodeName: 'summary_node',
            stateImports: ['should_summarize', 'summary_node'],
        };
    }
    return null;
}
