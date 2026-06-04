from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeSearcher4, nodeFormatter4, nodeResponder4

def build_Pipeline4():
    builder = StateGraph(State)

    builder.add_node("searcher4", nodeSearcher4)
    builder.add_node("formatter4", nodeFormatter4)
    builder.add_node("responder4", nodeResponder4)

    builder.add_edge(START, "searcher4")
    builder.add_edge("searcher4", "formatter4")
    builder.add_edge("formatter4", "responder4")
    builder.add_edge("responder4", END)

    return builder.compile()
