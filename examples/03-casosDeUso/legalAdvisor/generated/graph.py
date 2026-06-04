import os
from config import OPENAI_API_KEY, ANTHROPIC_API_KEY
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
os.environ["ANTHROPIC_API_KEY"] = ANTHROPIC_API_KEY
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from state import State, should_summarize, summary_node
from subgraph.Triage import build_Triage
from subgraph.SpecialistConsultation import build_SpecialistConsultation
from subgraph.FinalWriting import build_FinalWriting



# Construcción del grafo
builder = StateGraph(State)

# Subgrafos como nodos
Triage = build_Triage()
SpecialistConsultation = build_SpecialistConsultation()
FinalWriting = build_FinalWriting()

builder.add_node("triage", Triage)
builder.add_node("specialistconsultation", SpecialistConsultation)
builder.add_node("finalwriting", FinalWriting)

builder.add_node("summary_node", summary_node)
builder.add_edge("summary_node", END)

# Edges de inicio
builder.add_edge(START, "triage")

# Routers
def route_triage(state: State) -> str:
    if state["requiresHumanLawyer"] == True:
        return "finalwriting"
    if state["requiresHumanLawyer"] == False:
        return "specialistconsultation"
    return should_summarize(state)

# Transiciones
builder.add_conditional_edges(
    "triage",
    route_triage,
    {
        "finalwriting": "finalwriting",
        "specialistconsultation": "specialistconsultation",
        END: END,
        "summary_node": "summary_node"
    }
)
builder.add_edge("specialistconsultation", "finalwriting")
builder.add_conditional_edges(
    "finalwriting",
    should_summarize,
    {
        "summary_node": "summary_node",
        END: END
    }
)

# Compilar
graph = builder.compile()
