from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeClassifier, nodeScienceExpert, nodeHistoryExpert, nodeGeneralExpert

def build_knowledgeTriage():
    builder = StateGraph(State)

    builder.add_node("classifier", nodeClassifier)
    builder.add_node("scienceexpert", nodeScienceExpert)
    builder.add_node("historyexpert", nodeHistoryExpert)
    builder.add_node("generalexpert", nodeGeneralExpert)

    builder.add_edge(START, "classifier")

    return builder.compile()
