from langgraph.graph import StateGraph, START, END
from langgraph.types import Command
from typing import Literal, TypedDict
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.chat_models import init_chat_model
from state import State
from prompt import SPECIALISTORCHESTRATORPROMPT
from agents import nodeLaborLawyer, nodeCivilLawyer, nodeCriminalLawyer, nodeTaxLawyer


COORDINADOR_ENRUTAMIENTO = """
Debes responder siempre con un objeto JSON con un único campo "next".
Los valores válidos para "next" son:
- "laborlawyer"
- "civillawyer"
- "criminallawyer"
- "taxlawyer"
- "FINISH"

Reglas:
- Delega al agente más adecuado para gestionar la solicitud.
- Delega a UN SOLO especialista por turno.
- El bloque "Estado actual del sistema" muestra los campos del estado compartido que los especialistas escriben tras actuar; úsalos para saber si una tarea ya está resuelta y, en ese caso, responde "FINISH".
- No delegues al mismo agente dos veces para la misma solicitud.

"""

class Router(TypedDict):
    next: Literal["laborlawyer", "civillawyer", "criminallawyer", "taxlawyer", "FINISH"]

modelCoordinator = init_chat_model(model="openai:gpt-5-nano", temperature=0)

def _format_conversation(messages) -> str:
    """Serializa el historial a texto etiquetado por autor."""
    lineas = []
    for m in messages:
        autor = getattr(m, "name", None) or m.type
        contenido = m.content if isinstance(m.content, str) else str(m.content)
        if contenido:
            lineas.append(f"- {autor}: {contenido}")
    return "\n".join(lineas) if lineas else "(sin mensajes todavía)"

def coordinator_node(state: State) -> Command[Literal["laborlawyer", "civillawyer", "criminallawyer", "taxlawyer", "__end__"]]:
    # El coordinador no participa en el chat: recibe la conversación como texto
    # dentro de un único HumanMessage. El input termina siempre en turno humano.
    resumen = state.get("summary")
    bloque_resumen = f"Resumen de la conversación previa:\n{resumen}\n\n" if resumen else ""
    contexto = f"""
{bloque_resumen}Conversación hasta ahora:
{_format_conversation(state["messages"])}

Estado actual del sistema:
        - legalAnalysis (Análisis jurídico realizado por el especialista del área correspondiente.): {state.get("legalAnalysis", "No registrado aún")}
        - recommendedActions (Acciones recomendadas por el especialista, en orden de prioridad.): {state.get("recommendedActions", "No registrado aún")}
        - deadlines (Plazos legales aplicables al caso (prescripción, caducidad, plazos de recurso, etc.).): {state.get("deadlines", "No registrado aún")}

Decide el siguiente paso: delega al agente adecuado o responde "FINISH" si la tarea ya está resuelta.
"""
    messages = [
        SystemMessage(content=COORDINADOR_ENRUTAMIENTO + SPECIALISTORCHESTRATORPROMPT),
        HumanMessage(content=contexto),
    ]
    response = modelCoordinator.with_structured_output(Router).invoke(messages)
    goto = END if response["next"] == "FINISH" else response["next"]
    return Command(goto=goto)

def build_SpecialistConsultation():
    builder = StateGraph(State)

    builder.add_node("coordinator", coordinator_node)
    builder.add_node("laborlawyer", nodeLaborLawyer)
    builder.add_node("civillawyer", nodeCivilLawyer)
    builder.add_node("criminallawyer", nodeCriminalLawyer)
    builder.add_node("taxlawyer", nodeTaxLawyer)

    builder.add_edge(START, "coordinator")
    builder.add_edge("laborlawyer", "coordinator")
    builder.add_edge("civillawyer", "coordinator")
    builder.add_edge("criminallawyer", "coordinator")
    builder.add_edge("taxlawyer", "coordinator")

    return builder.compile()
