import os


from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from state import State
from subgraph.Grafo import build_Grafo



# Construcción del grafo
builder = StateGraph(State)

# Subgrafos como nodos
Grafo = build_Grafo()

builder.add_node("grafo", Grafo)



# Edges de inicio
builder.add_edge(START, "grafo")

# Routers


# Transiciones
builder.add_edge("grafo", END)

# Compilar
graph = builder.compile()
