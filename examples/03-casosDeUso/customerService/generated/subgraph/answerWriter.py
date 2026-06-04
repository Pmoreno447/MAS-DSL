from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeAnswerWriterNode

def build_answerWriter():
    builder = StateGraph(State)

    builder.add_node("answerwriternode", nodeAnswerWriterNode)

    builder.add_edge(START, "answerwriternode")
    builder.add_edge("answerwriternode", END)

    return builder.compile()
