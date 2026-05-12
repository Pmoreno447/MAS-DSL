# agents.py
from langchain_core.messages import SystemMessage, HumanMessage
from prompt import COORDINATOR, ANALYZER, SUMMARIZER, FORMATTER, VALIDATOR, PUBLISHER
from state import State
from langchain.chat_models import init_chat_model



from pydantic import BaseModel, Field



# Salidas de los nodos
class FormatterOutput(BaseModel):
    report: str = Field(description="Informe final formateado listo para publicar")

class ValidatorOutput(BaseModel):
    approved: bool = Field(description="True si el contenido supera el umbral de calidad")

class AnalyzerOutput(BaseModel):
    content: str = Field(description="Contenido a procesar")
    score: int = Field(description="Puntuación de calidad del 0 al 10")

class SummarizerOutput(BaseModel):
    summary: str = Field(description="Resumen del contenido generado")

# Modelos
modelFormatter = init_chat_model(model="openai:gpt-4o-mini", temperature=0).with_structured_output(FormatterOutput)
modelValidator = init_chat_model(model="openai:gpt-4o-mini", temperature=0).with_structured_output(ValidatorOutput)
modelPublisher = init_chat_model(model="openai:gpt-4o-mini", temperature=0)
modelAnalyzer = init_chat_model(model="openai:gpt-4o-mini", temperature=0).with_structured_output(AnalyzerOutput)
modelSummarizer = init_chat_model(model="openai:gpt-4o-mini", temperature=0).with_structured_output(SummarizerOutput)



# Nodos del grafo
def nodeFormatter(state: State):
    """"""
    result = modelFormatter.invoke(
        [SystemMessage(content=FORMATTER)]
        + state["messages"]
        + [HumanMessage(content=f"""
            summary: {state.get("summary", "No registrado aún")}
            score: {state.get("score", "No registrado aún")}
        """)]
    )
    return {
        "report": result.report
    }

def nodeValidator(state: State):
    """"""
    result = modelValidator.invoke(
        [SystemMessage(content=VALIDATOR)]
        + state["messages"]
        + [HumanMessage(content=f"""
            report: {state.get("report", "No registrado aún")}
            score: {state.get("score", "No registrado aún")}
        """)]
    )
    return {
        "approved": result.approved
    }

def nodePublisher(state: State):
    """"""
    result = modelPublisher.invoke(
        [SystemMessage(content=PUBLISHER)]
        + state["messages"]
        + [HumanMessage(content=f"""
            report: {state.get("report", "No registrado aún")}
            approved: {state.get("approved", "No registrado aún")}
        """)]
    )
    return {"messages": [result]}

def nodeAnalyzer(state: State):
    """"""
    result = modelAnalyzer.invoke(
        [SystemMessage(content=ANALYZER)]
        + state["messages"]
        
    )
    return {
        "content": result.content,
        "score": result.score
    }

def nodeSummarizer(state: State):
    """"""
    result = modelSummarizer.invoke(
        [SystemMessage(content=SUMMARIZER)]
        + state["messages"]
        + [HumanMessage(content=f"""
            content: {state.get("content", "No registrado aún")}
        """)]
    )
    return {
        "summary": result.summary
    }
