import os
from config import OPENAI_API_KEY
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from state import State
from subgraph.knowledgeTriage import build_knowledgeTriage



# Construcción del grafo
builder = StateGraph(State)

# Subgrafos como nodos
knowledgeTriage = build_knowledgeTriage()

builder.add_node("knowledgetriage", knowledgeTriage)



# Edges de inicio
builder.add_edge(START, "knowledgetriage")

# Routers


# Transiciones
builder.add_edge("knowledgetriage", END)

# Compilar
graph = builder.compile()
