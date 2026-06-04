from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeRootCauseSynthesizer, nodeRemediator

def build_AutomaticResolution():
    builder = StateGraph(State)

    builder.add_node("rootcausesynthesizer", nodeRootCauseSynthesizer)
    builder.add_node("remediator", nodeRemediator)

    builder.add_edge(START, "rootcausesynthesizer")
    builder.add_edge("rootcausesynthesizer", "remediator")
    builder.add_edge("remediator", END)

    return builder.compile()
