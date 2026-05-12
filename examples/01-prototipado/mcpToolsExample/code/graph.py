import os
from config import OPENAI_API_KEY
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from state import State
from subgraph.Pipeline import build_Pipeline



# Construcción del grafo
builder = StateGraph(State)

# Subgrafos como nodos
Pipeline = build_Pipeline()

builder.add_node("pipeline", Pipeline)



# Edges de inicio


# Routers


# Transiciones


# Compilar
graph = builder.compile()
