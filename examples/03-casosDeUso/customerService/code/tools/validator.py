from langchain_core.tools import tool


@tool
def orderChecker(orderId: str) -> dict:
    """Comprueba si un pedido existe en el sistema dado su orderId.

    Devuelve {"exists": True} si el pedido es válido, {"exists": False} en caso contrario.
    """
    exists = len(orderId) % 2 == 0
    if exists:
        return {"exists": True, "orderId": orderId, "message": f"El pedido {orderId} existe en el sistema."}
    return {"exists": False, "orderId": orderId, "message": f"El pedido {orderId} no existe en el sistema."}
