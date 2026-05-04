from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeSenior

def build_Grafo():
    builder = StateGraph(State)

    builder.add_node("senior", nodeSenior)

    builder.add_edge(START, "senior")
    builder.add_edge("senior", END)

    return builder.compile()
