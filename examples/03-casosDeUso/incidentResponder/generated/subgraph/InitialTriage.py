from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeTriager

def build_InitialTriage():
    builder = StateGraph(State)

    builder.add_node("triager", nodeTriager)

    builder.add_edge(START, "triager")
    builder.add_edge("triager", END)

    return builder.compile()
