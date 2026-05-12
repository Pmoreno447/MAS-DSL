from langgraph.graph import StateGraph, START, END
from langgraph.types import Command
from typing import Literal, TypedDict
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.chat_models import init_chat_model
from state import State
from prompt import COORDINATOR
from agents import nodeAnalyzer, nodeSummarizer


COORDINADOR_ENRUTAMIENTO = """
Debes responder siempre con un objeto JSON con un único campo "next".
Los valores válidos para "next" son:
- "analyzer"
- "summarizer"
- "FINISH"

Reglas:
- Delega al agente más adecuado para gestionar la solicitud.
- Delega a UN SOLO especialista por turno.
- El bloque "Estado actual del sistema" muestra los campos del estado compartido que los especialistas escriben tras actuar; úsalos para saber si una tarea ya está resuelta y, en ese caso, responde "FINISH".
- No delegues al mismo agente dos veces para la misma solicitud.

"""

class Router(TypedDict):
    next: Literal["analyzer", "summarizer", "FINISH"]

modelCoordinator = init_chat_model(model="openai:gpt-4o", temperature=0)

def coordinator_node(state: State) -> Command[Literal["analyzer", "summarizer", "__end__"]]:
    messages = (
        [SystemMessage(content=COORDINADOR_ENRUTAMIENTO + COORDINATOR)]
        + state["messages"]
        + [HumanMessage(content=f"""
Estado actual del sistema:
        - content (Contenido a procesar): {state.get("content", "No registrado aún")}
        - score (Puntuación de calidad del 0 al 10): {state.get("score", "No registrado aún")}
        - summary (Resumen del contenido generado): {state.get("summary", "No registrado aún")}
    """)]
    )
    response = modelCoordinator.with_structured_output(Router).invoke(messages)
    goto = END if response["next"] == "FINISH" else response["next"]
    return Command(goto=goto)

def build_ContentHub():
    builder = StateGraph(State)

    builder.add_node("coordinator", coordinator_node)
    builder.add_node("analyzer", nodeAnalyzer)
    builder.add_node("summarizer", nodeSummarizer)

    builder.add_edge(START, "coordinator")
    builder.add_edge("analyzer", "coordinator")
    builder.add_edge("summarizer", "coordinator")

    return builder.compile()
