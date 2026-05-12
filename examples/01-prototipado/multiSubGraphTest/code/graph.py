import os
from config import OPENAI_API_KEY
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from state import State
from subgraph.Pipeline1 import build_Pipeline1
from subgraph.Pipeline2 import build_Pipeline2
from subgraph.Pipeline3 import build_Pipeline3
from subgraph.Pipeline4 import build_Pipeline4



# Construcción del grafo
builder = StateGraph(State)

# Subgrafos como nodos
Pipeline1 = build_Pipeline1()
Pipeline2 = build_Pipeline2()
Pipeline3 = build_Pipeline3()
Pipeline4 = build_Pipeline4()

builder.add_node("pipeline1", Pipeline1)
builder.add_node("pipeline2", Pipeline2)
builder.add_node("pipeline3", Pipeline3)
builder.add_node("pipeline4", Pipeline4)



# Edges de inicio
builder.add_edge(START, "pipeline1")

# Routers
def route_pipeline1(state: State) -> str:
    if state["bool"] == True:
        return "pipeline2"
    if state["bool"] == False:
        return "pipeline3"
    return END

def route_pipeline3(state: State) -> str:
    if state["x"] > 12:
        return "pipeline4"
    if state["x"] < 5:
        return "pipeline3"
    if state["x"] == 1:
        return "pipeline2"
    return END

def route_pipeline4(state: State) -> str:
    if state["y"] == "Test":
        return END
    return "pipeline1"

# Transiciones
builder.add_conditional_edges(
    "pipeline1",
    route_pipeline1,
    {
        "pipeline2": "pipeline2",
        "pipeline3": "pipeline3",
        END: END
    }
)
builder.add_edge("pipeline2", "pipeline3")
builder.add_conditional_edges(
    "pipeline3",
    route_pipeline3,
    {
        "pipeline4": "pipeline4",
        "pipeline3": "pipeline3",
        "pipeline2": "pipeline2",
        END: END
    }
)
builder.add_conditional_edges(
    "pipeline4",
    route_pipeline4,
    {
        END: END,
        "pipeline1": "pipeline1"
    }
)

# Compilar
graph = builder.compile()
