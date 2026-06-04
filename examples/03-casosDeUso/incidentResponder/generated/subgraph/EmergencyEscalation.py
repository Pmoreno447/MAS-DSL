from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeEscalator

def build_EmergencyEscalation():
    builder = StateGraph(State)

    builder.add_node("escalator", nodeEscalator)

    builder.add_edge(START, "escalator")
    builder.add_edge("escalator", END)

    return builder.compile()
