# agents.py
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from prompt import CLASSIFIERPROFILE, SCIENCEEXPERTPROFILE, HISTORYEXPERTPROFILE, GENERALEXPERTPROFILE
from state import State
from langchain.chat_models import init_chat_model

from langgraph.types import Command
from langgraph.graph import END
from typing import Literal

from pydantic import BaseModel, Field



# Salidas de los nodos
class ClassifierOutput(BaseModel):
    message: str = Field(description="Tu respuesta al usuario.")
    next: Literal["classifier", "scienceexpert", "historyexpert", "generalexpert", "END"] = Field(description="Próximo nodo al que delegar dentro del cluster decentralized; END para terminar.")
    domain: str = Field(description="Dominio detectado de la pregunta: science, history, o general")

class ScienceExpertOutput(BaseModel):
    message: str = Field(description="Tu respuesta al usuario.")
    next: Literal["classifier", "scienceexpert", "historyexpert", "generalexpert", "END"] = Field(description="Próximo nodo al que delegar dentro del cluster decentralized; END para terminar.")
    answer: str = Field(description="Respuesta final elaborada para el usuario")

class HistoryExpertOutput(BaseModel):
    message: str = Field(description="Tu respuesta al usuario.")
    next: Literal["classifier", "scienceexpert", "historyexpert", "generalexpert", "END"] = Field(description="Próximo nodo al que delegar dentro del cluster decentralized; END para terminar.")
    answer: str = Field(description="Respuesta final elaborada para el usuario")

class GeneralExpertOutput(BaseModel):
    message: str = Field(description="Tu respuesta al usuario.")
    next: Literal["classifier", "scienceexpert", "historyexpert", "generalexpert", "END"] = Field(description="Próximo nodo al que delegar dentro del cluster decentralized; END para terminar.")
    answer: str = Field(description="Respuesta final elaborada para el usuario")

# Modelos
modelClassifier = init_chat_model(model="openai:gpt-4o", temperature=0.2).with_structured_output(ClassifierOutput)
modelScienceExpert = init_chat_model(model="openai:gpt-4o", temperature=0.4).with_structured_output(ScienceExpertOutput)
modelHistoryExpert = init_chat_model(model="openai:gpt-4o", temperature=0.4).with_structured_output(HistoryExpertOutput)
modelGeneralExpert = init_chat_model(model="openai:gpt-4o", temperature=0.5).with_structured_output(GeneralExpertOutput)





# Nodos del grafo
def nodeClassifier(state: State) -> Command[Literal["classifier", "scienceexpert", "historyexpert", "generalexpert", "__end__"]]:
    """Clasifica la pregunta y delega al experto apropiado según su criterio"""
    result = modelClassifier.invoke(
        [SystemMessage(content=CLASSIFIERPROFILE)]
        + state["messages"]
        + [HumanMessage(content=f"""
            userQuestion: {state.get("userQuestion", "No registrado aún")}
        """)]
    )
    goto = END if result.next == "END" else result.next
    return Command(goto=goto, update={
        "messages": [AIMessage(content=result.message, name="classifier")],
        "domain": result.domain
    })

def nodeScienceExpert(state: State) -> Command[Literal["classifier", "scienceexpert", "historyexpert", "generalexpert", "__end__"]]:
    """Responde preguntas científicas y decide si necesita contexto histórico"""
    result = modelScienceExpert.invoke(
        [SystemMessage(content=SCIENCEEXPERTPROFILE)]
        + state["messages"]
        + [HumanMessage(content=f"""
            userQuestion: {state.get("userQuestion", "No registrado aún")}
            domain: {state.get("domain", "No registrado aún")}
            answer: {state.get("answer", "No registrado aún")}
        """)]
    )
    goto = END if result.next == "END" else result.next
    return Command(goto=goto, update={
        "messages": [AIMessage(content=result.message, name="scienceexpert")],
        "answer": result.answer
    })

def nodeHistoryExpert(state: State) -> Command[Literal["classifier", "scienceexpert", "historyexpert", "generalexpert", "__end__"]]:
    """Responde preguntas históricas y decide si necesita contexto científico"""
    result = modelHistoryExpert.invoke(
        [SystemMessage(content=HISTORYEXPERTPROFILE)]
        + state["messages"]
        + [HumanMessage(content=f"""
            userQuestion: {state.get("userQuestion", "No registrado aún")}
            domain: {state.get("domain", "No registrado aún")}
            answer: {state.get("answer", "No registrado aún")}
        """)]
    )
    goto = END if result.next == "END" else result.next
    return Command(goto=goto, update={
        "messages": [AIMessage(content=result.message, name="historyexpert")],
        "answer": result.answer
    })

def nodeGeneralExpert(state: State) -> Command[Literal["classifier", "scienceexpert", "historyexpert", "generalexpert", "__end__"]]:
    """Responde preguntas generales y redirige si detecta especialización requerida"""
    result = modelGeneralExpert.invoke(
        [SystemMessage(content=GENERALEXPERTPROFILE)]
        + state["messages"]
        + [HumanMessage(content=f"""
            userQuestion: {state.get("userQuestion", "No registrado aún")}
            domain: {state.get("domain", "No registrado aún")}
            answer: {state.get("answer", "No registrado aún")}
        """)]
    )
    goto = END if result.next == "END" else result.next
    return Command(goto=goto, update={
        "messages": [AIMessage(content=result.message, name="generalexpert")],
        "answer": result.answer
    })
