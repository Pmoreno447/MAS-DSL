# agents.py
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from prompt import SEARCHERPROFILE, FORMATTERPROFILE, RESPONDERPROFILE
from state import State
from langchain.chat_models import init_chat_model




from tools.mcpClients import tavily_search, tavily_extract
from tools.prueba import prueba

# Salidas de los nodos


# Modelos
modelSearcher = init_chat_model(model="openai:gpt-5-nano", temperature=0).bind_tools([tavily_search, tavily_extract])
modelFormatter = init_chat_model(model="openai:gpt-5-nano", temperature=0).bind_tools([prueba])
modelResponder = init_chat_model(model="openai:gpt-5-nano", temperature=0)
modelSearcher2 = init_chat_model(model="openai:gpt-5-nano", temperature=0).bind_tools([tavily_search, tavily_extract])
modelFormatter2 = init_chat_model(model="openai:gpt-5-nano", temperature=0).bind_tools([prueba])
modelResponder2 = init_chat_model(model="openai:gpt-5-nano", temperature=0)
modelSearcher3 = init_chat_model(model="openai:gpt-5-nano", temperature=0).bind_tools([tavily_search, tavily_extract])
modelFormatter3 = init_chat_model(model="openai:gpt-5-nano", temperature=0).bind_tools([prueba])
modelResponder3 = init_chat_model(model="openai:gpt-5-nano", temperature=0)
modelSearcher4 = init_chat_model(model="openai:gpt-5-nano", temperature=0).bind_tools([tavily_search, tavily_extract])
modelFormatter4 = init_chat_model(model="openai:gpt-5-nano", temperature=0).bind_tools([prueba])
modelResponder4 = init_chat_model(model="openai:gpt-5-nano", temperature=0)

_tools_by_name = {t.name: t for t in [tavily_search, tavily_extract, prueba]}



# Nodos del grafo
async def nodeSearcher(state: State):
    """"""
    messages = (
        [SystemMessage(content=SEARCHERPROFILE)]
        + state["messages"]
        
    )
    while True:
        response = await modelSearcher.ainvoke(messages)
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

async def nodeFormatter(state: State):
    """"""
    messages = (
        [SystemMessage(content=FORMATTERPROFILE)]
        + state["messages"]
        
    )
    while True:
        response = await modelFormatter.ainvoke(messages)
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

def nodeResponder(state: State):
    """"""
    result = modelResponder.invoke(
        [SystemMessage(content=RESPONDERPROFILE)]
        + state["messages"]
        
    )
    return {"messages": [result]}

async def nodeSearcher2(state: State):
    """"""
    messages = (
        [SystemMessage(content=SEARCHERPROFILE)]
        + state["messages"]
        
    )
    while True:
        response = await modelSearcher2.ainvoke(messages)
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

async def nodeFormatter2(state: State):
    """"""
    messages = (
        [SystemMessage(content=FORMATTERPROFILE)]
        + state["messages"]
        
    )
    while True:
        response = await modelFormatter2.ainvoke(messages)
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

def nodeResponder2(state: State):
    """"""
    result = modelResponder2.invoke(
        [SystemMessage(content=RESPONDERPROFILE)]
        + state["messages"]
        
    )
    return {"messages": [result]}

async def nodeSearcher3(state: State):
    """"""
    messages = (
        [SystemMessage(content=SEARCHERPROFILE)]
        + state["messages"]
        
    )
    while True:
        response = await modelSearcher3.ainvoke(messages)
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

async def nodeFormatter3(state: State):
    """"""
    messages = (
        [SystemMessage(content=FORMATTERPROFILE)]
        + state["messages"]
        
    )
    while True:
        response = await modelFormatter3.ainvoke(messages)
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

def nodeResponder3(state: State):
    """"""
    result = modelResponder3.invoke(
        [SystemMessage(content=RESPONDERPROFILE)]
        + state["messages"]
        
    )
    return {"messages": [result]}

async def nodeSearcher4(state: State):
    """"""
    messages = (
        [SystemMessage(content=SEARCHERPROFILE)]
        + state["messages"]
        
    )
    while True:
        response = await modelSearcher4.ainvoke(messages)
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

async def nodeFormatter4(state: State):
    """"""
    messages = (
        [SystemMessage(content=FORMATTERPROFILE)]
        + state["messages"]
        
    )
    while True:
        response = await modelFormatter4.ainvoke(messages)
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

def nodeResponder4(state: State):
    """"""
    result = modelResponder4.invoke(
        [SystemMessage(content=RESPONDERPROFILE)]
        + state["messages"]
        
    )
    return {"messages": [result]}
