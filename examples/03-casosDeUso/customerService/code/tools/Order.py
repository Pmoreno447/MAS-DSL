from langchain_core.tools import tool


@tool
def getInfoOrder(orderId: str) -> dict:
    """Recupera la información completa de un pedido a partir de su orderId."""
    return {
        "orderId": orderId,
        "issueDescription": "",
        "preferredSolution": "",
        "orderStatus": "en transito",
        "productID": "PROD-1234",
        "productBatch": "BATCH-2025-07",
        "trackingNumber": "TRK-987654321",
        "paymentAmount": 49,
        "paymentStatus": "pagado",
    }


@tool
def reopenShipmentCase(trackingNumber: str) -> dict:
    """Reabre el caso con la transportista dado el trackingNumber."""
    return {
        "success": True,
        "trackingNumber": trackingNumber,
        "message": f"Caso reabierto con la transportista para el envío {trackingNumber}. Plazo estimado de respuesta: 48h.",
    }


@tool
def requestDuplicateShipment(orderId: str) -> dict:
    """Solicita el reenvío de un pedido perdido dado el orderId."""
    return {
        "success": True,
        "orderId": orderId,
        "newTrackingNumber": "TRK-NEW-000111",
        "message": f"Reenvío del pedido {orderId} programado. Llegará en 3-5 días laborables.",
    }


@tool
def requestRefund(orderId: str, paymentAmount: int) -> dict:
    """Tramita la devolución del importe dado el orderId y el paymentAmount."""
    return {
        "success": True,
        "orderId": orderId,
        "refundedAmount": paymentAmount,
        "message": f"Reembolso de {paymentAmount}€ tramitado para el pedido {orderId}. Se reflejará en 3-7 días.",
    }


@tool
def applyDiscount(orderId: str) -> dict:
    """Aplica un descuento como compensación dado el orderId."""
    return {
        "success": True,
        "orderId": orderId,
        "discountPercent": 15,
        "message": f"Descuento del 15% aplicado al pedido {orderId} como compensación.",
    }


@tool
def requestReplacement(orderId: str) -> dict:
    """Gestiona el envío de un producto de reemplazo dado el orderId."""
    return {
        "success": True,
        "orderId": orderId,
        "replacementTrackingNumber": "TRK-REP-555888",
        "message": f"Reemplazo del producto del pedido {orderId} programado. Llegará en 3-5 días laborables.",
    }


@tool
def requestReturn(orderId: str) -> dict:
    """Inicia la devolución del producto y genera una etiqueta de devolución dado el orderId."""
    return {
        "success": True,
        "orderId": orderId,
        "returnLabelUrl": f"https://returns.example.com/labels/{orderId}.pdf",
        "message": f"Devolución del pedido {orderId} iniciada. Etiqueta de devolución generada.",
    }


@tool
def getDeliveryEstimate(orderId: str) -> dict:
    """Obtiene el tiempo estimado de entrega restante dado el orderId."""
    return {
        "orderId": orderId,
        "estimatedDeliveryDays": 2,
        "message": f"El pedido {orderId} llegará en aproximadamente 2 días laborables.",
    }
