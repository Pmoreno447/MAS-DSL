# agents.py
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from prompt import ASISTENTE
from state import State
from langchain.chat_models import init_chat_model







# Salidas de los nodos


# Modelos
modelChatBot = init_chat_model(model="openai:gpt-4o", temperature=0)



def _system_prompt(profile: str, state) -> str:
    """Antepone el resumen acumulado de la conversación (si existe) al profile."""
    resumen = state.get("summary")
    if resumen:
        return f"{profile}\n\nContexto previo resumido:\n{resumen}"
    return profile

# Nodos del grafo
def nodeChatBot(state: State):
    """Chatbot"""
    result = modelChatBot.invoke(
        [SystemMessage(content=_system_prompt(ASISTENTE, state))]
        + state["messages"]
        
    )
    return {"messages": [result]}
