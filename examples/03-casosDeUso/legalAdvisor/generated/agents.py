# agents.py
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from prompt import CLASSIFIERPROMPT, LEGALRESEARCHERPROMPT, LABORLAWYERPROMPT, CIVILLAWYERPROMPT, CRIMINALLAWYERPROMPT, TAXLAWYERPROMPT, SPECIALISTORCHESTRATORPROMPT, WRITERPROMPT
from state import State
from langchain.chat_models import init_chat_model



from pydantic import BaseModel, Field
from tools.mcpClients import tavily_search, tavily_extract
from tools.legal import checkLegalDeadlines
from tools.legal import searchLaborLaw
from tools.legal import searchCivilLaw
from tools.legal import searchCriminalLaw
from tools.legal import searchTaxLaw

# Salidas de los nodos
class ClassifierOutput(BaseModel):
    legalArea: str = Field(description="Área del derecho identificada: laboral, civil, penal o fiscal.")
    urgency: str = Field(description="Urgencia del caso: alta, media o baja.")
    requiresHumanLawyer: bool = Field(description="True si el caso es de tal gravedad o complejidad que debe ser derivado obligatoriamente a un abogado humano antes de continuar.")

class LegalResearcherOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    relevantLaws: str = Field(description="Artículos, leyes y normativas españolas relevantes para el caso (extraído de fuentes oficiales).")
    jurisprudence: str = Field(description="Resumen de sentencias y jurisprudencia aplicable encontrada en la búsqueda.")

class LaborLawyerOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    legalAnalysis: str = Field(description="Análisis jurídico realizado por el especialista del área correspondiente.")
    recommendedActions: str = Field(description="Acciones recomendadas por el especialista, en orden de prioridad.")
    deadlines: str = Field(description="Plazos legales aplicables al caso (prescripción, caducidad, plazos de recurso, etc.).")

class CivilLawyerOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    legalAnalysis: str = Field(description="Análisis jurídico realizado por el especialista del área correspondiente.")
    recommendedActions: str = Field(description="Acciones recomendadas por el especialista, en orden de prioridad.")
    deadlines: str = Field(description="Plazos legales aplicables al caso (prescripción, caducidad, plazos de recurso, etc.).")

class CriminalLawyerOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    legalAnalysis: str = Field(description="Análisis jurídico realizado por el especialista del área correspondiente.")
    recommendedActions: str = Field(description="Acciones recomendadas por el especialista, en orden de prioridad.")
    deadlines: str = Field(description="Plazos legales aplicables al caso (prescripción, caducidad, plazos de recurso, etc.).")

class TaxLawyerOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    legalAnalysis: str = Field(description="Análisis jurídico realizado por el especialista del área correspondiente.")
    recommendedActions: str = Field(description="Acciones recomendadas por el especialista, en orden de prioridad.")
    deadlines: str = Field(description="Plazos legales aplicables al caso (prescripción, caducidad, plazos de recurso, etc.).")

class WriterOutput(BaseModel):
    finalAdvice: str = Field(description="Asesoramiento final redactado en lenguaje claro para el cliente.")

# Modelos
modelClassifier = init_chat_model(model="openai:gpt-5-nano", temperature=0).with_structured_output(ClassifierOutput)
modelLegalResearcher = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0, timeout=60).bind_tools([tavily_search, tavily_extract, LegalResearcherOutput], tool_choice="any")
modelLaborLawyer = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0).bind_tools([searchLaborLaw, checkLegalDeadlines, LaborLawyerOutput], tool_choice="any")
modelCivilLawyer = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0).bind_tools([searchCivilLaw, checkLegalDeadlines, CivilLawyerOutput], tool_choice="any")
modelCriminalLawyer = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0).bind_tools([searchCriminalLaw, checkLegalDeadlines, CriminalLawyerOutput], tool_choice="any")
modelTaxLawyer = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0).bind_tools([searchTaxLaw, checkLegalDeadlines, TaxLawyerOutput], tool_choice="any")
modelWriter = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0).with_structured_output(WriterOutput)

_tools_by_name = {t.name: t for t in [tavily_search, tavily_extract, checkLegalDeadlines, searchLaborLaw, searchCivilLaw, searchCriminalLaw, searchTaxLaw]}

def _system_prompt(profile: str, state) -> str:
    """Antepone el resumen acumulado de la conversación (si existe) al profile."""
    resumen = state.get("summary")
    if resumen:
        return f"{profile}\n\nContexto previo resumido:\n{resumen}"
    return profile

# Nodos del grafo
def nodeClassifier(state: State):
    """Clasificador inicial del caso por área legal y urgencia."""
    result = modelClassifier.invoke(
        [SystemMessage(content=_system_prompt(CLASSIFIERPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            caseDescription: {state.get("caseDescription", "No registrado aún")}
        """)]
    )
    return {
        "legalArea": result.legalArea,
        "urgency": result.urgency,
        "requiresHumanLawyer": result.requiresHumanLawyer
    }

async def nodeLegalResearcher(state: State):
    """Investigador que consulta normativa y jurisprudencia española."""
    messages = (
        [SystemMessage(content=_system_prompt(LEGALRESEARCHERPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            caseDescription: {state.get("caseDescription", "No registrado aún")}
            legalArea: {state.get("legalArea", "No registrado aún")}
        """)]
    )
    while True:
        response = await modelLegalResearcher.ainvoke(messages)
        messages.append(response)
        if not response.tool_calls:
            return {"messages": [response]}
        for tc in response.tool_calls:
            if tc["name"] == "LegalResearcherOutput":
                return {
                    "relevantLaws": tc["args"]["relevantLaws"],
                    "jurisprudence": tc["args"]["jurisprudence"]
                }
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))

async def nodeLaborLawyer(state: State):
    """Especialista en derecho laboral."""
    messages = (
        [SystemMessage(content=_system_prompt(LABORLAWYERPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            caseDescription: {state.get("caseDescription", "No registrado aún")}
            legalArea: {state.get("legalArea", "No registrado aún")}
            relevantLaws: {state.get("relevantLaws", "No registrado aún")}
            jurisprudence: {state.get("jurisprudence", "No registrado aún")}
        """)]
    )
    while True:
        response = await modelLaborLawyer.ainvoke(messages)
        messages.append(response)
        if not response.tool_calls:
            response.name = "laborlawyer"
            return {"messages": [response]}
        for tc in response.tool_calls:
            if tc["name"] == "LaborLawyerOutput":
                return {
                    "legalAnalysis": tc["args"]["legalAnalysis"],
                    "recommendedActions": tc["args"]["recommendedActions"],
                    "deadlines": tc["args"]["deadlines"]
                }
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))

async def nodeCivilLawyer(state: State):
    """Especialista en derecho civil."""
    messages = (
        [SystemMessage(content=_system_prompt(CIVILLAWYERPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            caseDescription: {state.get("caseDescription", "No registrado aún")}
            legalArea: {state.get("legalArea", "No registrado aún")}
            relevantLaws: {state.get("relevantLaws", "No registrado aún")}
            jurisprudence: {state.get("jurisprudence", "No registrado aún")}
        """)]
    )
    while True:
        response = await modelCivilLawyer.ainvoke(messages)
        messages.append(response)
        if not response.tool_calls:
            response.name = "civillawyer"
            return {"messages": [response]}
        for tc in response.tool_calls:
            if tc["name"] == "CivilLawyerOutput":
                return {
                    "legalAnalysis": tc["args"]["legalAnalysis"],
                    "recommendedActions": tc["args"]["recommendedActions"],
                    "deadlines": tc["args"]["deadlines"]
                }
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))

async def nodeCriminalLawyer(state: State):
    """Especialista en derecho penal."""
    messages = (
        [SystemMessage(content=_system_prompt(CRIMINALLAWYERPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            caseDescription: {state.get("caseDescription", "No registrado aún")}
            legalArea: {state.get("legalArea", "No registrado aún")}
            relevantLaws: {state.get("relevantLaws", "No registrado aún")}
            jurisprudence: {state.get("jurisprudence", "No registrado aún")}
            requiresHumanLawyer: {state.get("requiresHumanLawyer", "No registrado aún")}
        """)]
    )
    while True:
        response = await modelCriminalLawyer.ainvoke(messages)
        messages.append(response)
        if not response.tool_calls:
            response.name = "criminallawyer"
            return {"messages": [response]}
        for tc in response.tool_calls:
            if tc["name"] == "CriminalLawyerOutput":
                return {
                    "legalAnalysis": tc["args"]["legalAnalysis"],
                    "recommendedActions": tc["args"]["recommendedActions"],
                    "deadlines": tc["args"]["deadlines"]
                }
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))

async def nodeTaxLawyer(state: State):
    """Especialista en derecho fiscal y tributario."""
    messages = (
        [SystemMessage(content=_system_prompt(TAXLAWYERPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            caseDescription: {state.get("caseDescription", "No registrado aún")}
            legalArea: {state.get("legalArea", "No registrado aún")}
            relevantLaws: {state.get("relevantLaws", "No registrado aún")}
            jurisprudence: {state.get("jurisprudence", "No registrado aún")}
        """)]
    )
    while True:
        response = await modelTaxLawyer.ainvoke(messages)
        messages.append(response)
        if not response.tool_calls:
            response.name = "taxlawyer"
            return {"messages": [response]}
        for tc in response.tool_calls:
            if tc["name"] == "TaxLawyerOutput":
                return {
                    "legalAnalysis": tc["args"]["legalAnalysis"],
                    "recommendedActions": tc["args"]["recommendedActions"],
                    "deadlines": tc["args"]["deadlines"]
                }
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))

def nodeWriter(state: State):
    """Redactor del asesoramiento final al cliente."""
    result = modelWriter.invoke(
        [SystemMessage(content=_system_prompt(WRITERPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            caseDescription: {state.get("caseDescription", "No registrado aún")}
            legalAnalysis: {state.get("legalAnalysis", "No registrado aún")}
            recommendedActions: {state.get("recommendedActions", "No registrado aún")}
            deadlines: {state.get("deadlines", "No registrado aún")}
            requiresHumanLawyer: {state.get("requiresHumanLawyer", "No registrado aún")}
        """)]
    )
    return {
        "finalAdvice": result.finalAdvice
    }
