# tools/legal.py
# Herramientas SIMULADAS para el caso de uso legalAdvisor.
# Las funciones de búsqueda (searchLaborLaw, searchCivilLaw...) emulan un sistema
# RAG sobre el corpus legal de cada área del derecho: devuelven artículos y
# jurisprudencia verosímiles. En un despliegue real harían retrieval sobre un
# vector store con la legislación y sentencias indexadas.
import time
from langchain_core.tools import tool


# ─── Plazos legales (transversal) ─────────────────────────────────────────────

@tool
def checkLegalDeadlines(procedureType: str) -> str:
    """Consulta los plazos legales aplicables a un tipo de procedimiento
    (despido, reclamación de cantidad, recurso de reposición, denuncia, etc.).
    Devuelve el plazo y la norma que lo regula."""
    print(f"\n⏱️  Consultando plazos para: '{procedureType}'...")
    time.sleep(1)
    return (
        f"Plazos aplicables a '{procedureType}':\n"
        "  - Impugnación de despido: 20 días HÁBILES desde la fecha del despido "
        "(art. 59.3 ET). Es un plazo de CADUCIDAD, no se interrumpe salvo por la "
        "papeleta de conciliación.\n"
        "  - Reclamación de cantidad (salarios, vacaciones): 1 AÑO desde que pudieron exigirse (art. 59.1 ET).\n"
        "  - Papeleta de conciliación (SMAC): requisito previo a la demanda; suspende el plazo de caducidad.\n"
        "  - Recurso de reposición (vía administrativa): 1 mes.\n"
        "  - Recurso contencioso-administrativo: 2 meses.\n"
        "Nota: los plazos en días hábiles excluyen sábados, domingos y festivos."
    )


# ─── Búsqueda documental por área ──────────────────────────────────────────────

@tool
def searchLaborLaw(query: str) -> str:
    """Busca en el corpus de Derecho Laboral (Estatuto de los Trabajadores,
    convenios colectivos y jurisprudencia de la Sala de lo Social del Tribunal
    Supremo) los artículos y sentencias relevantes para la consulta."""
    print(f"\n📚 [Laboral] Buscando en corpus: '{query}'...")
    time.sleep(1)
    return (
        f"Resultados de Derecho Laboral para '{query}':\n\n"
        "ARTÍCULOS:\n"
        "  - Art. 55.1 ET: el despido debe notificarse por ESCRITO, indicando los "
        "hechos y la fecha de efectos. El despido verbal incumple este requisito.\n"
        "  - Art. 55.4 ET: el despido que no cumple la forma escrita se declara IMPROCEDENTE.\n"
        "  - Art. 56 ET: el despido improcedente da derecho a readmisión o indemnización "
        "de 33 días de salario por año trabajado (con tope de 24 mensualidades).\n"
        "  - Art. 59.3 ET: plazo de caducidad de 20 días hábiles para impugnar.\n\n"
        "JURISPRUDENCIA:\n"
        "  - STS 4ª, 23/05/2019: el despido verbal es improcedente por defecto de forma, "
        "salvo que la empresa pruebe causa y forma posteriormente.\n"
        "  - STS 4ª, 18/02/2021: el abono de salarios pendientes y vacaciones no disfrutadas "
        "es exigible con independencia de la calificación del despido."
    )


@tool
def searchCivilLaw(query: str) -> str:
    """Busca en el corpus de Derecho Civil (Código Civil, Ley de Arrendamientos
    Urbanos, Ley de Enjuiciamiento Civil y jurisprudencia de la Sala Primera del
    Tribunal Supremo) los artículos y sentencias relevantes para la consulta."""
    print(f"\n📚 [Civil] Buscando en corpus: '{query}'...")
    time.sleep(1)
    return (
        f"Resultados de Derecho Civil para '{query}':\n\n"
        "ARTÍCULOS:\n"
        "  - Art. 1124 CC: facultad de resolver las obligaciones recíprocas ante incumplimiento.\n"
        "  - Art. 1101 CC: indemnización de daños y perjuicios por incumplimiento contractual.\n"
        "  - Art. 1964 CC: plazo de prescripción de 5 años para acciones personales (reforma de 2015).\n\n"
        "JURISPRUDENCIA:\n"
        "  - STS 1ª, 12/01/2020: el requerimiento fehaciente (burofax) interrumpe la prescripción.\n"
        "  - STS 1ª, 30/09/2021: la resolución contractual exige incumplimiento grave y esencial."
    )


@tool
def searchCriminalLaw(query: str) -> str:
    """Busca en el corpus de Derecho Penal (Código Penal, Ley de Enjuiciamiento
    Criminal y jurisprudencia de la Sala Segunda del Tribunal Supremo) los
    artículos y sentencias relevantes para la consulta."""
    print(f"\n📚 [Penal] Buscando en corpus: '{query}'...")
    time.sleep(1)
    return (
        f"Resultados de Derecho Penal para '{query}':\n\n"
        "ARTÍCULOS:\n"
        "  - Art. 147 CP: delito de lesiones; pena según gravedad y medios empleados.\n"
        "  - Art. 520 LECrim: derechos del detenido (asistencia letrada, intérprete, "
        "información de los hechos, asistencia médica).\n"
        "  - Art. 131 CP: plazos de prescripción del delito según la pena.\n\n"
        "JURISPRUDENCIA:\n"
        "  - STS 2ª, 14/03/2019: la asistencia letrada al detenido es irrenunciable en delitos graves.\n"
        "  - STS 2ª, 07/11/2020: nulidad de las diligencias practicadas sin letrado presente."
    )


@tool
def searchTaxLaw(query: str) -> str:
    """Busca en el corpus de Derecho Fiscal (Ley General Tributaria, leyes de
    IRPF/IVA/IS y doctrina del Tribunal Económico-Administrativo Central) los
    artículos y resoluciones relevantes para la consulta."""
    print(f"\n📚 [Fiscal] Buscando en corpus: '{query}'...")
    time.sleep(1)
    return (
        f"Resultados de Derecho Fiscal para '{query}':\n\n"
        "ARTÍCULOS:\n"
        "  - Art. 66 LGT: plazo de prescripción de 4 años para liquidar y recaudar.\n"
        "  - Art. 222-225 LGT: recurso de reposición (potestativo, 1 mes).\n"
        "  - Art. 226-240 LGT: reclamación económico-administrativa ante el TEAR/TEAC.\n\n"
        "DOCTRINA:\n"
        "  - RTEAC 18/09/2019: la falta de motivación de la sanción determina su anulación.\n"
        "  - RTEAC 22/06/2021: la suspensión del acto impugnado requiere garantía salvo perjuicios irreparables."
    )
