# state.py
from typing import Annotated, Optional
from typing_extensions import TypedDict
from state.reducers import trim_messages_reducer
from config import MAX_MESSAGES

class State(TypedDict):
    # Mensajes
    messages: Annotated[list, trim_messages_reducer(MAX_MESSAGES)]

    # Resumen
    summary: Optional[str]

    # Atributos
