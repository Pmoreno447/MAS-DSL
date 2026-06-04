from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeSearcher2, nodeFormatter2, nodeResponder2

def build_Pipeline2():
    builder = StateGraph(State)

    builder.add_node("searcher2", nodeSearcher2)
    builder.add_node("formatter2", nodeFormatter2)
    builder.add_node("responder2", nodeResponder2)

    builder.add_edge(START, "searcher2")
    builder.add_edge("searcher2", "formatter2")
    builder.add_edge("formatter2", "responder2")
    builder.add_edge("responder2", END)

    return builder.compile()
