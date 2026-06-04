# reducers.py
from langgraph.graph.message import add_messages

def trim_messages_reducer(max_messages: int):
    """
    Devuelve un reducer que mantiene solo los últimos max_messages mensajes,
    conservando siempre el primero.
    """
    def reducer(current: list, new: list) -> list:
        updated = add_messages(current, new)
        if len(updated) > max_messages:
            return [updated[0]] + updated[-(max_messages - 1):]
        return updated
    return reducer
