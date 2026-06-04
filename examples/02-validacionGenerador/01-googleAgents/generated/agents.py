# agents.py
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from prompt import PROGRAMADORSENIOR
from state import State
from langchain.chat_models import init_chat_model
from langgraph.config import get_stream_writer



from tools.mcpClients import tavily_search, tavily_extract


# Salidas de los nodos


# Modelos
modelSenior = init_chat_model(model="google_genai:gemini-2.5-flash", temperature=1).bind_tools([tavily_search, tavily_extract])

_tools_by_name = {t.name: t for t in [tavily_search, tavily_extract]}



# Nodos del grafo
async def nodeSenior(state: State):
    """Programador senior"""
    messages = (
        [SystemMessage(content=PROGRAMADORSENIOR)]
        + state["messages"]
        
    )
    while True:
        response = await modelSenior.ainvoke(messages)
        messages.append(response)
        if not response.tool_calls:
            return {"messages": [response]}
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))
