# agents.py
from langchain_core.messages import SystemMessage, HumanMessage
from prompt import ASISTENTE
from state import State
from langchain.chat_models import init_chat_model







# Salidas de los nodos


# Modelos
modelChatBot = init_chat_model(model="openai:gpt-4o", temperature=0)



# Nodos del grafo
def nodeChatBot(state: State):
    """Chatbot"""
    result = modelChatBot.invoke(
        [SystemMessage(content=ASISTENTE)]
        + state["messages"]
        
    )
    return {"messages": [result]}
