from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeWriter

def build_FinalWriting():
    builder = StateGraph(State)

    builder.add_node("writer", nodeWriter)

    builder.add_edge(START, "writer")
    builder.add_edge("writer", END)

    return builder.compile()
