import os
from config import OPENAI_API_KEY
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from state import State
from subgraph.ResearchPipeline import build_ResearchPipeline



# Construcción del grafo
builder = StateGraph(State)

# Subgrafos como nodos
ResearchPipeline = build_ResearchPipeline()

builder.add_node("researchpipeline", ResearchPipeline)



# Edges de inicio
builder.add_edge(START, "researchpipeline")

# Routers


# Transiciones
builder.add_edge("researchpipeline", END)

# Compilar
graph = builder.compile()
