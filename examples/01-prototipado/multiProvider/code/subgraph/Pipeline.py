from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeResearcher, nodeWriter, nodeCritic, nodeEditor

def build_Pipeline():
    builder = StateGraph(State)

    builder.add_node("researcher", nodeResearcher)
    builder.add_node("writer", nodeWriter)
    builder.add_node("critic", nodeCritic)
    builder.add_node("editor", nodeEditor)

    builder.add_edge(START, "researcher")
    builder.add_edge("researcher", "writer")
    builder.add_edge("writer", "critic")
    builder.add_edge("critic", "editor")
    builder.add_edge("editor", END)

    return builder.compile()
