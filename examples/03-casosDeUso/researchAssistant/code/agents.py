# agents.py
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from prompt import RESEARCHER, WRITER
from state import State
from langchain.chat_models import init_chat_model


from pydantic import BaseModel, Field
from tools.mcpClients import tavily_search, tavily_extract


# Salidas de los nodos
class ResearcherOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    searchSummary: str = Field(description="Resumen estructurado de los hallazgos obtenidos de la búsqueda web.")
    sources: str = Field(description="Lista de URLs y títulos de las fuentes consultadas, separadas por saltos de línea.")

class WriterOutput(BaseModel):
    report: str = Field(description="Informe final redactado a partir de los hallazgos.")

# Modelos
modelResearcher = init_chat_model(model="openai:gpt-4o", temperature=0).bind_tools([tavily_search, tavily_extract, ResearcherOutput], tool_choice="required")
modelWriter = init_chat_model(model="openai:gpt-4o", temperature=0).with_structured_output(WriterOutput)

_tools_by_name = {t.name: t for t in [tavily_search, tavily_extract]}

# Nodos del grafo
async def nodeResearcher(state: State):
    """Agente investigador que busca información en la web con Tavily."""
    messages = (
        [SystemMessage(content=RESEARCHER)]
        + state["messages"]
        
    )
    while True:
        response = await modelResearcher.ainvoke(messages)
        messages.append(response)
        if not response.tool_calls:
            return {"messages": [response]}
        for tc in response.tool_calls:
            if tc["name"] == "ResearcherOutput":
                return {
                    "searchSummary": tc["args"]["searchSummary"],
                    "sources": tc["args"]["sources"]
                }
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))

def nodeWriter(state: State):
    """Agente redactor que elabora el informe final a partir de los hallazgos."""
    result = modelWriter.invoke(
        [SystemMessage(content=WRITER)]
        + state["messages"]
        + [HumanMessage(content=f"""
            topic: {state.get("topic", "No registrado aún")}
            searchSummary: {state.get("searchSummary", "No registrado aún")}
            sources: {state.get("sources", "No registrado aún")}
        """)]
    )
    return {
        "report": result.report
    }
