# config.py — ARCHIVO GENERADO AUTOMÁTICAMENTE — NO EDITAR A MANO
from dotenv import load_dotenv
import os

load_dotenv()

os.environ["LANGCHAIN_TRACING_V2"] = "true"
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_PROJECT = os.getenv("LANGSMITH_PROJECT")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# Configuración de mensajes
MAX_MESSAGES = int(os.getenv("MAX_MESSAGES", 10))
MAX_TOKENS = int(os.getenv("MAX_TOKENS", 1000))

# Configuración de la base de datos
DB_URI=os.getenv("DB_URI")
