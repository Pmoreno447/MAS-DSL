from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeResearcher, nodeWriter

def build_ResearchPipeline():
    builder = StateGraph(State)

    builder.add_node("researcher", nodeResearcher)
    builder.add_node("writer", nodeWriter)

    builder.add_edge(START, "researcher")
    builder.add_edge("researcher", "writer")
    builder.add_edge("writer", END)

    return builder.compile()
