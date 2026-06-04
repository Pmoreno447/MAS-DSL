import os
from config import OPENAI_API_KEY
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from state import State
from subgraph.ValidationGraph import build_ValidationGraph
from subgraph.ExtractorGraph import build_ExtractorGraph
from subgraph.answerGraph import build_answerGraph
from subgraph.specializedAssistants import build_specializedAssistants



# Construcción del grafo
builder = StateGraph(State)

# Subgrafos como nodos
ValidationGraph = build_ValidationGraph()
ExtractorGraph = build_ExtractorGraph()
answerGraph = build_answerGraph()
specializedAssistants = build_specializedAssistants()

builder.add_node("validationgraph", ValidationGraph)
builder.add_node("extractorgraph", ExtractorGraph)
builder.add_node("answergraph", answerGraph)
builder.add_node("specializedassistants", specializedAssistants)



# Edges de inicio
builder.add_edge(START, "validationgraph")

# Routers
def route_validationgraph(state: State) -> str:
    if state["isValid"] == False:
        return "answergraph"
    if state["isValid"] == True:
        return "extractorgraph"
    return END

# Transiciones
builder.add_conditional_edges(
    "validationgraph",
    route_validationgraph,
    {
        "answergraph": "answergraph",
        "extractorgraph": "extractorgraph",
        END: END
    }
)
builder.add_edge("extractorgraph", "specializedassistants")
builder.add_edge("specializedassistants", "answergraph")
builder.add_edge("answergraph", END)

# Compilar
graph = builder.compile()
