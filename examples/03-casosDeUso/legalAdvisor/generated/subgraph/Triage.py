from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeClassifier, nodeLegalResearcher

def build_Triage():
    builder = StateGraph(State)

    builder.add_node("classifier", nodeClassifier)
    builder.add_node("legalresearcher", nodeLegalResearcher)

    builder.add_edge(START, "classifier")
    builder.add_edge("classifier", "legalresearcher")
    builder.add_edge("legalresearcher", END)

    return builder.compile()
