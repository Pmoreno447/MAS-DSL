# agents.py
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from prompt import PROGRAMADORSENIOR
from state import State
from langchain.chat_models import init_chat_model
from langgraph.config import get_stream_writer
from config import OLLAMA_BASE_URL

from tools.mcpClients import tavily_search, tavily_extract


# Salidas de los nodos


# Modelos
modelSenior = init_chat_model(model="ollama:qwen2.5", temperature=1, base_url=OLLAMA_BASE_URL, timeout=60).bind_tools([tavily_search, tavily_extract])

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
