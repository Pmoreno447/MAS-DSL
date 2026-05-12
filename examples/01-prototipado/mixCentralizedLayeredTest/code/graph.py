import os
from config import OPENAI_API_KEY
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from state import State
from subgraph.ContentHub import build_ContentHub
from subgraph.PublishPipeline import build_PublishPipeline



# Construcción del grafo
builder = StateGraph(State)

# Subgrafos como nodos
ContentHub = build_ContentHub()
PublishPipeline = build_PublishPipeline()

builder.add_node("contenthub", ContentHub)
builder.add_node("publishpipeline", PublishPipeline)



# Edges de inicio
builder.add_edge(START, "contenthub")

# Routers
def route_publishpipeline(state: State) -> str:
    if state["score"] < 6:
        return "contenthub"
    if state["approved"] == True:
        return END
    return END

# Transiciones
builder.add_edge("contenthub", "publishpipeline")
builder.add_conditional_edges(
    "publishpipeline",
    route_publishpipeline,
    {
        "contenthub": "contenthub",
        END: END
    }
)

# Compilar
graph = builder.compile()
