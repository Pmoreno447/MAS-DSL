# multiAgentDSL

Extensión desarrollada como Trabajo de Fin de Grado en la **Universidad de Extremadura**.

Define sistemas multi-agente con IA en ficheros `.mad` y genera automáticamente el código Python listo para ejecutar con [LangGraph](https://www.langchain.com/langgraph).

---

## ¿Qué hace?

Escribes un modelo `.mad` describiendo los agentes, sus proveedores (OpenAI, Anthropic, Google, Ollama), cómo se comunican entre sí y cómo persiste el estado. La extensión valida el modelo en tiempo real y genera el proyecto Python completo:

- Grafo LangGraph con todos los nodos y transiciones
- Soporte automático de persistencia en **memoria**, **PostgreSQL** o **MongoDB**
- Fichero `requirements.txt` con las dependencias necesarias
- `.env.template` con las variables de entorno requeridas

El proyecto generado es compatible con `langgraph dev` para desarrollo y depuración con interfaz gráfica, y con `langgraph build` para obtener una imagen Docker lista para desplegar.

---

## Botones del editor

Cuando hay un fichero `.mad` abierto aparecen tres botones en la barra del editor:

| Botón | Acción |
|---|---|
| 🚀 | **Generar código** — genera el proyecto Python en una carpeta `generated/` junto al `.mad` |
| 📊 | **Ver diagrama** — abre una vista del grafo del sistema con las estructuras y transiciones |
| 📖 | **Ayuda** — abre la referencia completa del lenguaje |

---

## Requisitos

- [bierner.markdown-mermaid](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) — para renderizar el diagrama (se instala automáticamente)
- Python 3.12 para ejecutar el código generado
