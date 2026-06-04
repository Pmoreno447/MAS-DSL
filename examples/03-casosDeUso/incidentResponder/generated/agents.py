# agents.py
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from prompt import TRIAGERPROMPT, LOGANALYSTPROMPT, METRICSANALYSTPROMPT, DEPLOYANALYSTPROMPT, ROOTCAUSESYNTHESIZERPROMPT, REMEDIATORPROMPT, ESCALATORPROMPT
from state import State
from langchain.chat_models import init_chat_model

from langgraph.types import Command
from langgraph.graph import END
from typing import Literal

from pydantic import BaseModel, Field

from tools.ops import getRecentLogs
from tools.ops import getServiceMetrics
from tools.ops import getRecentDeployments
from tools.ops import rollbackDeployment
from tools.ops import restartService
from tools.ops import scaleService
from tools.ops import createPagerDutyIncident
from tools.ops import notifyChannel

# Salidas de los nodos
class TriagerOutput(BaseModel):
    affectedService: str = Field(description="Nombre del servicio afectado (ej: 'payment-api', 'user-db', 'frontend-web').")
    severity: str = Field(description="Severidad evaluada: critical, high, medium o low.")
    requiresImmediate: bool = Field(description="True si la incidencia requiere escalado humano inmediato (severity critical o servicio crítico caído en producción).")

class LogAnalystOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    next: Literal["loganalyst", "metricsanalyst", "deployanalyst", "END"] = Field(description="Próximo nodo al que delegar dentro del cluster decentralized; END para terminar.")
    logsFindings: str = Field(description="Patrones de error, excepciones y eventos relevantes encontrados en los logs recientes.")

class MetricsAnalystOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    next: Literal["loganalyst", "metricsanalyst", "deployanalyst", "END"] = Field(description="Próximo nodo al que delegar dentro del cluster decentralized; END para terminar.")
    metricsFindings: str = Field(description="Anomalías detectadas en métricas de CPU, memoria, latencia, error rate, throughput.")

class DeployAnalystOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    next: Literal["loganalyst", "metricsanalyst", "deployanalyst", "END"] = Field(description="Próximo nodo al que delegar dentro del cluster decentralized; END para terminar.")
    deploysFindings: str = Field(description="Deployments recientes en el servicio afectado y sus dependencias, con su correlación temporal con la incidencia.")

class RootCauseSynthesizerOutput(BaseModel):
    rootCause: str = Field(description="Causa raíz identificada tras consolidar los hallazgos de los tres analistas.")
    remediationPlan: str = Field(description="Plan de remediación propuesto, con pasos concretos y orden de ejecución.")

class RemediatorOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    actionTaken: str = Field(description="Acción ejecutada por el sistema (rollback, restart, scale-up, etc.) o notificación enviada.")

class EscalatorOutput(BaseModel):
    """Llama a esta herramienta cuando hayas terminado para entregar el resultado final."""
    pagerCreated: bool = Field(description="True si se ha creado un incidente en PagerDuty para escalar a oncall humano.")
    actionTaken: str = Field(description="Acción ejecutada por el sistema (rollback, restart, scale-up, etc.) o notificación enviada.")

# Modelos
modelTriager = init_chat_model(model="openai:gpt-5-nano", temperature=0).with_structured_output(TriagerOutput)
modelLogAnalyst = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0, timeout=45).bind_tools([getRecentLogs, LogAnalystOutput], tool_choice="any")
modelMetricsAnalyst = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0, timeout=45).bind_tools([getServiceMetrics, MetricsAnalystOutput], tool_choice="any")
modelDeployAnalyst = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0, timeout=45).bind_tools([getRecentDeployments, DeployAnalystOutput], tool_choice="any")
modelRootCauseSynthesizer = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0).with_structured_output(RootCauseSynthesizerOutput)
modelRemediator = init_chat_model(model="anthropic:claude-sonnet-4-6", temperature=0, max_retries=2).bind_tools([rollbackDeployment, restartService, scaleService, notifyChannel, RemediatorOutput], tool_choice="any")
modelEscalator = init_chat_model(model="openai:gpt-5-nano", temperature=0).bind_tools([createPagerDutyIncident, notifyChannel, EscalatorOutput], tool_choice="any")

_tools_by_name = {t.name: t for t in [getRecentLogs, getServiceMetrics, getRecentDeployments, rollbackDeployment, restartService, scaleService, createPagerDutyIncident, notifyChannel]}

def _system_prompt(profile: str, state) -> str:
    """Antepone el resumen acumulado de la conversación (si existe) al profile."""
    resumen = state.get("summary")
    if resumen:
        return f"{profile}\n\nContexto previo resumido:\n{resumen}"
    return profile

# Nodos del grafo
def nodeTriager(state: State):
    """Agente de triaje inicial de alertas."""
    result = modelTriager.invoke(
        [SystemMessage(content=_system_prompt(TRIAGERPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            alertDescription: {state.get("alertDescription", "No registrado aún")}
        """)]
    )
    return {
        "affectedService": result.affectedService,
        "severity": result.severity,
        "requiresImmediate": result.requiresImmediate
    }

async def nodeLogAnalyst(state: State) -> Command[Literal["loganalyst", "metricsanalyst", "deployanalyst", "__end__"]]:
    """Analista de logs del servicio afectado."""
    messages = (
        [SystemMessage(content=_system_prompt(LOGANALYSTPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            affectedService: {state.get("affectedService", "No registrado aún")}
            logsFindings: {state.get("logsFindings", "No registrado aún")}
            metricsFindings: {state.get("metricsFindings", "No registrado aún")}
            deploysFindings: {state.get("deploysFindings", "No registrado aún")}
        """)]
    )
    while True:
        response = await modelLogAnalyst.ainvoke(messages)
        messages.append(response)
        for tc in response.tool_calls:
            if tc["name"] == "LogAnalystOutput":
                goto = END if tc["args"]["next"] == "END" else tc["args"]["next"]
                return Command(goto=goto, update={
                    "messages": [AIMessage(content=tc["args"]["logsFindings"], name="loganalyst")],
                    "logsFindings": tc["args"]["logsFindings"]
                })
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))

async def nodeMetricsAnalyst(state: State) -> Command[Literal["loganalyst", "metricsanalyst", "deployanalyst", "__end__"]]:
    """Analista de métricas del servicio afectado."""
    messages = (
        [SystemMessage(content=_system_prompt(METRICSANALYSTPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            affectedService: {state.get("affectedService", "No registrado aún")}
            logsFindings: {state.get("logsFindings", "No registrado aún")}
            metricsFindings: {state.get("metricsFindings", "No registrado aún")}
            deploysFindings: {state.get("deploysFindings", "No registrado aún")}
        """)]
    )
    while True:
        response = await modelMetricsAnalyst.ainvoke(messages)
        messages.append(response)
        for tc in response.tool_calls:
            if tc["name"] == "MetricsAnalystOutput":
                goto = END if tc["args"]["next"] == "END" else tc["args"]["next"]
                return Command(goto=goto, update={
                    "messages": [AIMessage(content=tc["args"]["metricsFindings"], name="metricsanalyst")],
                    "metricsFindings": tc["args"]["metricsFindings"]
                })
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))

async def nodeDeployAnalyst(state: State) -> Command[Literal["loganalyst", "metricsanalyst", "deployanalyst", "__end__"]]:
    """Analista de despliegues recientes correlacionados con la incidencia."""
    messages = (
        [SystemMessage(content=_system_prompt(DEPLOYANALYSTPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            affectedService: {state.get("affectedService", "No registrado aún")}
            logsFindings: {state.get("logsFindings", "No registrado aún")}
            metricsFindings: {state.get("metricsFindings", "No registrado aún")}
            deploysFindings: {state.get("deploysFindings", "No registrado aún")}
        """)]
    )
    while True:
        response = await modelDeployAnalyst.ainvoke(messages)
        messages.append(response)
        for tc in response.tool_calls:
            if tc["name"] == "DeployAnalystOutput":
                goto = END if tc["args"]["next"] == "END" else tc["args"]["next"]
                return Command(goto=goto, update={
                    "messages": [AIMessage(content=tc["args"]["deploysFindings"], name="deployanalyst")],
                    "deploysFindings": tc["args"]["deploysFindings"]
                })
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))

def nodeRootCauseSynthesizer(state: State):
    """Síntesis de los hallazgos y propuesta de plan de remediación."""
    result = modelRootCauseSynthesizer.invoke(
        [SystemMessage(content=_system_prompt(ROOTCAUSESYNTHESIZERPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            logsFindings: {state.get("logsFindings", "No registrado aún")}
            metricsFindings: {state.get("metricsFindings", "No registrado aún")}
            deploysFindings: {state.get("deploysFindings", "No registrado aún")}
            alertDescription: {state.get("alertDescription", "No registrado aún")}
        """)]
    )
    return {
        "rootCause": result.rootCause,
        "remediationPlan": result.remediationPlan
    }

async def nodeRemediator(state: State):
    """Ejecutor automatizado del plan de remediación."""
    messages = (
        [SystemMessage(content=_system_prompt(REMEDIATORPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            rootCause: {state.get("rootCause", "No registrado aún")}
            remediationPlan: {state.get("remediationPlan", "No registrado aún")}
            affectedService: {state.get("affectedService", "No registrado aún")}
        """)]
    )
    while True:
        response = await modelRemediator.ainvoke(messages)
        messages.append(response)
        if not response.tool_calls:
            return {"messages": [response]}
        for tc in response.tool_calls:
            if tc["name"] == "RemediatorOutput":
                return {
                    "actionTaken": tc["args"]["actionTaken"]
                }
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))

async def nodeEscalator(state: State):
    """Escalador a oncall humano vía PagerDuty."""
    messages = (
        [SystemMessage(content=_system_prompt(ESCALATORPROMPT, state))]
        + state["messages"]
        + [HumanMessage(content=f"""
            severity: {state.get("severity", "No registrado aún")}
            alertDescription: {state.get("alertDescription", "No registrado aún")}
            affectedService: {state.get("affectedService", "No registrado aún")}
        """)]
    )
    while True:
        response = await modelEscalator.ainvoke(messages)
        messages.append(response)
        if not response.tool_calls:
            return {"messages": [response]}
        for tc in response.tool_calls:
            if tc["name"] == "EscalatorOutput":
                return {
                    "pagerCreated": tc["args"]["pagerCreated"],
                    "actionTaken": tc["args"]["actionTaken"]
                }
        for tc in response.tool_calls:
            tool = _tools_by_name[tc["name"]]
            try:
                result = await tool.ainvoke(tc["args"])
                messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
            except Exception as e:
                messages.append(ToolMessage(content=f"Error al llamar herramienta '{tc['name']}': {e}", tool_call_id=tc["id"]))
