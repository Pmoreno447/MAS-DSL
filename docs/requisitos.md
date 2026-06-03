# Requisitos del proyecto

## RF-L — Requisitos Funcionales del Lenguaje (`packages/language`)

| ID | Requisito |
|---|---|
| RF-L01 | El lenguaje debe permitir definir un bloque `context` con atributos tipados (`string`, `int`, `boolean`) con descripción obligatoria |
| RF-L02 | El lenguaje debe permitir restringir atributos a un conjunto cerrado de valores mediante un bloque `literal` |
| RF-L03 | El lenguaje debe permitir definir perfiles (`profile`) reutilizables que actúan como prompt de sistema de los agentes |
| RF-L04 | El lenguaje debe permitir declarar agentes con proveedor, modelo, perfil, herramientas, parámetros opcionales y referencias al estado |
| RF-L05 | El lenguaje debe permitir declarar herramientas Python locales (`pythonTool`) y servidores MCP (`mcpServer`) |
| RF-L06 | El lenguaje debe permitir definir estructuras de comunicación `layered`, `centralized`, `decentralized` y `sharedMessagePool` |
| RF-L07 | El lenguaje debe permitir definir transiciones entre estructuras (`from/to`) con condiciones opcionales sobre atributos del estado |
| RF-L08 | El lenguaje debe permitir declarar un nodo `Summarizer` para gestión del historial de mensajes |
| RF-L09 | El lenguaje debe permitir declarar la estrategia de persistencia del estado (`inMemorySave`, `postgresSave`, `mongoSave`) |
| RF-L10 | El validador debe comprobar que el modelo LLM declarado es válido para el proveedor indicado |
| RF-L11 | El validador debe comprobar que todas las estructuras de comunicación participan en al menos una transición (R01) |
| RF-L12 | El validador debe comprobar que no existen URLs duplicadas entre servidores MCP (R02) |
| RF-L13 | El validador debe comprobar que existe exactamente un punto de inicio `START` (R03) |
| RF-L14 | El validador debe comprobar que no existen arcos duplicados con condición entre el mismo par origen-destino (R04) |
| RF-L15 | El validador debe comprobar que la única transición desde un origen no lleva condición (R05) |
| RF-L16 | El validador debe comprobar que el tipo del valor en una condición es compatible con el tipo del atributo referenciado (R06) |
| RF-L17 | El validador debe comprobar que no existe más de una transición sin condición desde un mismo origen (R07) |
| RF-L18 | El validador debe comprobar que la temperatura de cualquier actor está entre 0.0 y 1.0 (R08) |
| RF-L19 | El validador debe comprobar que solo existe un `Summarizer` en el sistema (R09) |
| RF-L20 | El validador debe comprobar que los valores numéricos opcionales (`maxToken`, `timeOut`, `maxRetries`, `tokenTrigger`, `maxMessages`) son positivos (R10) |
| RF-L21 | El validador debe comprobar que las estructuras `layered` no contienen ciclos (R11) |
| RF-L22 | El validador debe comprobar que las `apiKeyName` de los servidores MCP son únicas (R12) |
| RF-L23 | El validador debe comprobar que todos los elementos del sistema tienen nombres únicos (R13) |
| RF-L24 | El validador debe comprobar que el nodo `Summarizer` no tiene perfil asignado (R14) |
| RF-L25 | El validador debe comprobar que cada agente pertenece a una única estructura de comunicación (R15) |
| RF-L26 | El proveedor de scope debe restringir `stateContext` y `stateUpdate` a los atributos declarados en el `context` del sistema |
| RF-L27 | El proveedor de completado debe sugerir los modelos válidos para el proveedor declarado en el agente al completar el campo `model` |

---

## RF-E — Requisitos Funcionales de la Extensión (`packages/extension`)

| ID | Requisito |
|---|---|
| RF-E01 | La extensión debe activar el Language Server al abrir cualquier archivo `.mad` |
| RF-E02 | La extensión debe proporcionar resaltado de sintaxis para archivos `.mad` mediante gramática TextMate |
| RF-E03 | La extensión debe proporcionar autocompletado de referencias filtrado por el tipo esperado en cada posición |
| RF-E04 | La extensión debe sugerir los modelos disponibles del proveedor declarado al completar el campo `model` de un agente |
| RF-E05 | La extensión debe mostrar documentación contextual (hover) sobre las palabras clave del DSL y sobre los nodos del modelo |
| RF-E06 | La extensión debe proporcionar snippets para las construcciones más habituales del lenguaje |
| RF-E07 | La extensión debe mostrar los errores y warnings del validador subrayados en tiempo real mientras el usuario escribe |
| RF-E08 | La extensión debe exponer un comando accesible desde la barra del editor para generar el código Python del modelo activo |
| RF-E09 | El comando de generación debe abortar y notificar al usuario si el modelo contiene errores de validación |
| RF-E10 | El comando de generación debe abrir el archivo `graph.py` resultante tras completarse con éxito |
| RF-E11 | La extensión debe exponer un comando para visualizar el modelo como diagrama Mermaid en un panel lateral |
| RF-E12 | El diagrama debe actualizarse automáticamente al guardar el archivo `.mad` si el panel de previsualización ya está abierto |
| RF-E13 | La extensión debe advertir al usuario cuando use combinaciones de proveedor y estructura que pueden producir comportamientos incorrectos |

---

## RF-G — Requisitos Funcionales del Generador (`packages/cli`)

| ID | Requisito |
|---|---|
| RF-G01 | El generador debe producir `prompts.py` con las cadenas de texto de los perfiles de los agentes |
| RF-G02 | El generador debe producir `state.py` con el `TypedDict` del estado compartido derivado del `context` del modelo |
| RF-G03 | El generador debe producir `agents.py` con la instanciación de los LLMs y sus esquemas de salida estructurada (`BaseModel`) |
| RF-G04 | El generador debe producir `graph.py` con el grafo LangGraph completo incluyendo nodos, aristas y funciones de enrutamiento |
| RF-G05 | El generador debe producir `.env.template` con todas las variables de entorno necesarias según los proveedores y herramientas usados |
| RF-G06 | El generador debe producir `requirements.txt` con las dependencias Python exactas según el contenido del modelo |
| RF-G07 | El generador debe producir `langgraph.json` para el despliegue con `langgraph dev` y `langgraph build` |
| RF-G08 | El generador debe producir `checkpointer.py` con la configuración de persistencia correspondiente al tipo declarado en el modelo |
| RF-G09 | El generador debe soportar los proveedores OpenAI, Anthropic, Google (`google_genai`) y Ollama |
| RF-G10 | El generador debe producir código correcto para la estructura de comunicación `layered` |
| RF-G11 | El generador debe producir código correcto para la estructura de comunicación `centralized`, etiquetando los mensajes de los agentes con su nombre |
| RF-G12 | El generador debe producir código correcto para la estructura de comunicación `decentralized`, usando `Command` de LangGraph para el enrutamiento |
| RF-G13 | El generador debe combinar múltiples estructuras de comunicación como subgrafos dentro de un grafo principal |
| RF-G14 | El generador debe producir funciones de enrutamiento condicional (`route_*`) para las transiciones con condición declaradas en el modelo |
| RF-G15 | El generador debe producir el cliente MCP (`mcpClients.py`) para cada `mcpServer` declarado en el modelo |
| RF-G16 | El generador debe inyectar el resumen del historial como parte del prompt de sistema cuando se usa un nodo `Summarizer` |
| RF-G17 | El generador debe ser invocable desde la línea de comandos mediante `multi-agent-dsl-cli generate <archivo.mad>` |

---

## RNF — Requisitos No Funcionales

| ID | Requisito |
|---|---|
| RNF01 | El Language Server debe procesar y validar el modelo en tiempo real sin demoras perceptibles durante la edición |
| RNF02 | El proyecto debe estar organizado como monorepo npm con workspaces, manteniendo los tres paquetes independientes pero coordinados |
| RNF03 | El código generado debe ser ejecutable directamente con `langgraph dev` sin requerir modificaciones manuales |
| RNF04 | El generador debe ser determinista: el mismo modelo `.mad` debe producir siempre el mismo código Python |
| RNF05 | Todo el toolchain debe estar escrito en TypeScript con tipado estricto |
| RNF06 | El proyecto debe requerir Node.js ≥ 20 por el uso nativo de ES Modules (`"type": "module"`) |
| RNF07 | Los paquetes `language` y `cli` deben disponer de tests automatizados con Vitest que cubran las restricciones del validador y los artefactos del generador |
| RNF08 | La extensión debe ser compatible con VSCode ≥ 1.67 |
| RNF09 | Los modelos de ejemplo deben poder generarse y ejecutarse de extremo a extremo sin intervención manual más allá de rellenar las API keys |
