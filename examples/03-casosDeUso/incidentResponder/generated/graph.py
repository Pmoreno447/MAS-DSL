import os
from config import OPENAI_API_KEY, ANTHROPIC_API_KEY
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
os.environ["ANTHROPIC_API_KEY"] = ANTHROPIC_API_KEY
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from state import State, should_summarize, summary_node
from subgraph.InitialTriage import build_InitialTriage
from subgraph.ParallelDiagnosis import build_ParallelDiagnosis
from subgraph.AutomaticResolution import build_AutomaticResolution
from subgraph.EmergencyEscalation import build_EmergencyEscalation



# Construcción del grafo
builder = StateGraph(State)

# Subgrafos como nodos
InitialTriage = build_InitialTriage()
ParallelDiagnosis = build_ParallelDiagnosis()
AutomaticResolution = build_AutomaticResolution()
EmergencyEscalation = build_EmergencyEscalation()

builder.add_node("initialtriage", InitialTriage)
builder.add_node("paralleldiagnosis", ParallelDiagnosis)
builder.add_node("automaticresolution", AutomaticResolution)
builder.add_node("emergencyescalation", EmergencyEscalation)

builder.add_node("summary_node", summary_node)
builder.add_edge("summary_node", END)

# Edges de inicio
builder.add_edge(START, "initialtriage")

# Routers
def route_initialtriage(state: State) -> str:
    if state["requiresImmediate"] == True:
        return "emergencyescalation"
    if state["requiresImmediate"] == False:
        return "paralleldiagnosis"
    return should_summarize(state)

# Transiciones
builder.add_conditional_edges(
    "initialtriage",
    route_initialtriage,
    {
        "emergencyescalation": "emergencyescalation",
        "paralleldiagnosis": "paralleldiagnosis",
        END: END,
        "summary_node": "summary_node"
    }
)
builder.add_edge("paralleldiagnosis", "automaticresolution")
builder.add_conditional_edges(
    "automaticresolution",
    should_summarize,
    {
        "summary_node": "summary_node",
        END: END
    }
)
builder.add_conditional_edges(
    "emergencyescalation",
    should_summarize,
    {
        "summary_node": "summary_node",
        END: END
    }
)

# Compilar
graph = builder.compile()
