# reducers.py
from langchain_core.messages import RemoveMessage, BaseMessage
from langchain.chat_models import init_chat_model
from langgraph.graph import END
import tiktoken
from langgraph.graph.message import add_messages
from config import MAX_TOKENS

def trim_messages_reducer(max_messages: int):
    """
    Devuelve un reducer que mantiene solo los últimos max_messages mensajes,
    conservando siempre el primero.
    """
    def reducer(current: list, new: list) -> list:
        updated = add_messages(current, new)
        if len(updated) > max_messages:
            return [updated[0]] + updated[-(max_messages - 1):]
        return updated
    return reducer

llm = init_chat_model("openai:gpt-5-nano")

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
    return "\n".join(f"{m.type}: {_content_to_text(m.content)}" for m in messages)

# Sin anotación de tipo en 'state': LangGraph llama get_type_hints() en los
# nodos/routers y un forward-ref a State requeriría importarlo en runtime,
# lo que crearía un ciclo state.py <-> reducers.py en la estrategia MIX.
def should_summarize(state) -> str:
    return "summary_node" if _count_tokens(state["messages"]) > MAX_TOKENS else END

async def summary_node(state):
    messages = state["messages"]
    split = _safe_split_index(messages)

    # Mensajes a comprimir (todo lo anterior al turno humano en curso).
    to_compress = messages[:split]
    if not to_compress:
        return {}

    existing_summary = state.get("summary")
    formatted = _format_for_prompt(to_compress)

    if existing_summary:
        prompt = (
            "Actualiza el siguiente resumen estructurado integrando los nuevos mensajes. "
            "Conserva la estructura por secciones y no descartes hechos previos relevantes.\n\n"
            f"Resumen previo:\n{existing_summary}\n\n"
            f"Nuevos mensajes:\n{formatted}\n\n"
            "Devuelve el resumen actualizado con estas secciones:\n"
            "- Objetivos del usuario\n"
            "- Decisiones tomadas\n"
            "- Hechos establecidos\n"
            "- Pendientes"
        )
    else:
        prompt = (
            "Resume la siguiente conversación de forma estructurada. "
            "Sé conciso pero no pierdas información operativa.\n\n"
            f"Conversación:\n{formatted}\n\n"
            "Devuelve el resumen con estas secciones:\n"
            "- Objetivos del usuario\n"
            "- Decisiones tomadas\n"
            "- Hechos establecidos\n"
            "- Pendientes"
        )

    new_summary = await llm.ainvoke(prompt)
    summary_text = _content_to_text(new_summary.content)

    # Los mensajes comprimidos se borran del historial. El resumen vive en el
    # campo `summary` del estado, no en `messages`: así no se renderiza como un
    # turno de chat y los agentes lo reciben antepuesto a su propio profile.
    to_delete = [RemoveMessage(id=m.id) for m in to_compress if m.id is not None]

    return {
        "messages": to_delete,
        "summary": summary_text,
    }
