from langgraph.graph import StateGraph, START, END
from state import State
from agents import nodeChatBot

def build_Grafo():
    builder = StateGraph(State)

    builder.add_node("chatbot", nodeChatBot)

    builder.add_edge(START, "chatbot")
    builder.add_edge("chatbot", END)

    return builder.compile()
