from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeSearcher3, nodeFormatter3, nodeResponder3

def build_Pipeline3():
    builder = StateGraph(State)

    builder.add_node("searcher3", nodeSearcher3)
    builder.add_node("formatter3", nodeFormatter3)
    builder.add_node("responder3", nodeResponder3)

    builder.add_edge(START, "searcher3")
    builder.add_edge("searcher3", "formatter3")
    builder.add_edge("formatter3", "responder3")
    builder.add_edge("responder3", END)

    return builder.compile()
