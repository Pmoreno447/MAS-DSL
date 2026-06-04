# tools/ops.py
# Herramientas SIMULADAS para el caso de uso incidentResponder.
# No conectan con sistemas reales (Datadog, Kubernetes, PagerDuty, Slack...);
# devuelven datos verosímiles para poder ejecutar y demostrar el grafo end-to-end.
import time
from langchain_core.tools import tool


# ─── Diagnóstico ────────────────────────────────────────────────────────────

@tool
def getRecentLogs(service: str) -> str:
    """Obtiene las entradas de log recientes (~15 min) del servicio indicado.
    Úsala para identificar excepciones, stacktraces y errores HTTP 5xx."""
    print(f"\n📄 Recuperando logs recientes de '{service}'...")
    time.sleep(1)
    return (
        f"Logs de '{service}' (últimos 15 min):\n"
        "  [14:02:11] INFO  request handled in 35ms\n"
        "  [14:03:47] ERROR psycopg2.OperationalError: connection pool exhausted (size=20)\n"
        "  [14:03:48] ERROR psycopg2.OperationalError: connection pool exhausted (size=20)\n"
        "  [14:03:52] WARN  slow query detected (1240ms)\n"
        "  [14:04:01] ERROR HTTP 503 Service Unavailable (x47 en 60s)\n"
        "Patrón dominante: agotamiento del pool de conexiones a BD desde las 14:03:47."
    )


@tool
def getServiceMetrics(service: str) -> str:
    """Obtiene las métricas de la última hora del servicio (CPU, memoria,
    latencia p50/p95/p99, error rate, throughput). Úsala para detectar anomalías."""
    print(f"\n📊 Consultando métricas de '{service}'...")
    time.sleep(1)
    return (
        f"Métricas de '{service}' (última hora):\n"
        "  CPU:        62% (normal ~55%)\n"
        "  Memoria:    71% (normal ~60%)\n"
        "  Latencia p50: 90ms (normal ~40ms)\n"
        "  Latencia p99: 4200ms (normal ~300ms)  <-- ANOMALÍA\n"
        "  Error rate: 18% (normal <1%)           <-- ANOMALÍA\n"
        "  Throughput: 420 req/s (normal ~500 req/s)\n"
        "Inicio de la degradación: 14:03 aprox. Tendencia: empeorando."
    )


@tool
def getRecentDeployments(service: str) -> str:
    """Obtiene los despliegues de las últimas 4 horas del servicio y sus
    dependencias. Úsala para correlacionar la incidencia con un cambio reciente."""
    print(f"\n🔍 Revisando despliegues recientes de '{service}'...")
    time.sleep(1)
    return (
        f"Despliegues recientes relacionados con '{service}' (últimas 4h):\n"
        "  - 11:20  frontend-web      v2.4.0   (autor: ana)   sin relación temporal\n"
        f"  - 14:01  {service}        v3.1.0   (autor: luis)  <-- SOSPECHOSO (incidencia a las 14:03)\n"
        "Cambios en v3.1.0: 'reduce DB pool size from 50 to 20 to save memory' (commit a3f9c1)."
    )


# ─── Remediación ────────────────────────────────────────────────────────────

@tool
def rollbackDeployment(service: str) -> str:
    """Revierte el último despliegue del servicio a la versión anterior.
    Úsala cuando un deploy reciente se identifica como causa de la incidencia."""
    print(f"\n⏪ Haciendo rollback del último despliegue de '{service}'...")
    time.sleep(2)
    return f"OK: '{service}' revertido a la versión anterior. Despliegue defectuoso retirado."


@tool
def restartService(service: str) -> str:
    """Reinicia el servicio indicado. Úsala ante fugas de memoria, conexiones
    colgadas o errores transitorios."""
    print(f"\n🔄 Reiniciando '{service}'...")
    time.sleep(2)
    return f"OK: '{service}' reiniciado correctamente. Pods en estado Running."


@tool
def scaleService(service: str, instances: int = 2) -> str:
    """Aumenta el número de instancias del servicio. Úsala ante saturación por carga."""
    print(f"\n📈 Escalando '{service}' a {instances} instancias...")
    time.sleep(2)
    return f"OK: '{service}' escalado a {instances} instancias."


# ─── Comunicación / escalado ──────────────────────────────────────────────────

@tool
def createPagerDutyIncident(severity: str, service: str, description: str) -> str:
    """Crea un incidente en PagerDuty para escalar a un ingeniero de guardia.
    Úsala cuando la severidad requiere intervención humana inmediata."""
    print(f"\n🚨 Creando incidente PagerDuty [{severity}] para '{service}'...")
    time.sleep(1)
    incident_id = "PD-2024-8842"
    return (
        f"OK: incidente {incident_id} creado.\n"
        f"  Severidad: {severity}\n  Servicio: {service}\n"
        f"  URL: https://acme.pagerduty.com/incidents/{incident_id}"
    )


@tool
def notifyChannel(message: str) -> str:
    """Envía un mensaje a un canal de Slack. Úsala SIEMPRE al final para informar
    de la acción tomada o del escalado realizado."""
    print(f"\n💬 Enviando a #sre-incidents:\n{message}")
    time.sleep(1)
    return "OK: mensaje publicado en #sre-incidents."
