# multiAgentDSL — Referencia del lenguaje

Un sistema se define entre llaves `{ }` con este orden:

```
{
    context   ...
    profile   ...  (0 o más)
    pythonTool / mcpServer  ...  (0 o más)
    agent / summarizer / coordinator  ...  (1 o más)
    layered / centralized / decentralized  ...  (1 o más)
    from  ...  (transiciones, 0 o más)
}
```

---

## context

Define el estado compartido del sistema y su mecanismo de persistencia.

```
context MiContexto {
    attribute nombreAttr type string description "descripción"
    maxMessages 10          // opcional: máx. mensajes retenidos
    persistence inMemorySave
}
```

**Tipos de atributo:** `int` · `string` · `boolean`

**Persistencia:**

| Valor | Descripción |
|---|---|
| `inMemorySave` | En memoria, se pierde al terminar |
| `Postgre` | PostgreSQL. Requiere `POSTGRES_URI` |
| `MongoDB` | MongoDB. Requiere `MONGODB_URI` |

---

## profile

System prompt reutilizable por cualquier agente.

```
profile nombrePerfil description "Eres un asistente útil y conciso."
```

---

## agent

Unidad LLM básica. Es el actor más común.

```
agent MiAgente {
    provider openai
    model "gpt-4o"
    profile miPerfil            // opcional
    temperature 0.7             // opcional: 0.0–1.0
    description "..."           // opcional
    stateContext attr1, attr2   // atributos que lee del estado
    stateUpdate attr1           // atributos que escribe en el estado
    statusMessage "Pensando..."  // opcional: mensaje de progreso
    maxToken 2000               // opcional
    timeOut 30                  // opcional, segundos
    maxRetries 3                // opcional
    tools herramienta1          // opcional
}
```

---

## coordinator

Orquesta a los agentes de una estructura `centralized`. Decide a quién delegar en cada turno.

```
coordinator MiCoordinador {
    provider openai
    model "gpt-4o"
    profile miPerfil    // opcional
    temperature 0.0     // opcional
}
```

---

## summarizer

Resume la conversación cuando supera el umbral de tokens. Solo puede haber uno por sistema.

```
summarizer MiSummarizer {
    provider anthropic
    model "claude-sonnet-4-6"
    profile miPerfil        // opcional
    tokenTrigger 3000       // opcional: umbral en tokens
}
```

---

## pythonTool

Herramienta implementada en Python local.

```
pythonTool miHerramienta modulePath "tools/mi_modulo"
```

---

## mcpServer

Herramienta remota accesible vía protocolo MCP.

```
mcpServer miServidor {
    url "https://mcp.ejemplo.com/mcp?key={key}"
    transport "streamable_http"
    apiKeyName "MI_API_KEY"     // opcional: nombre de la var. de entorno
    tools "tool1", "tool2"
}
```

Cuando se declara `apiKeyName`, el generador sustituye el marcador `{key}` de la URL por el valor de la variable de entorno en tiempo de ejecución:

```python
# código generado en tools/mcpClients.py
"https://mcp.ejemplo.com/mcp?key={key}".replace("{key}", MI_API_KEY)
```

`MI_API_KEY` se importa desde `config.py`, que la lee del fichero `.env`. La clave nunca queda hardcodeada en el código generado.

---

## Estructuras de comunicación

### layered

Los agentes se ejecutan en cadena. El último `layer` no lleva `next`.

```
layered miCadena {
    layer Agente1 next Agente2
    layer Agente2 next Agente3
    layer Agente3
}
```

### centralized

Un coordinador decide qué agente actúa en cada turno.

```
centralized miEstructura {
    coordinator MiCoordinador
    agents Agente1, Agente2, Agente3
}
```

### decentralized

Los agentes se comunican entre sí sin jerarquía. Mínimo 2 agentes.

```
decentralized miEstructura {
    agents Agente1, Agente2
}
```

---

## Transiciones (`from`)

Conectan estructuras de comunicación entre sí. El grafo necesita al menos un `from START` y un `to END`.

```
from START to estructura1
from estructura1 to estructura2 when miAtributo equal "listo"
from estructura2 to END
```

**Operadores de condición:** `equal` · `greather` · `lower`

**Valores literales:** `True` · `False` · número entero · `"cadena"`

> Las condiciones solo pueden comparar atributos del `context` con literales del mismo tipo.

---

## Proveedores y modelos disponibles

### openai
`gpt-5.4` · `gpt-5.4-pro` · `gpt-5.4-mini` · `gpt-5.4-nano` · `gpt-5` · `gpt-5-mini` · `gpt-5-nano` · `gpt-4.1` · `gpt-4.1-mini` · `gpt-4.1-nano` · `gpt-4o` · `gpt-4o-mini` · `o3-pro` · `o3` · `o4-mini` · `o3-mini` · `o1-pro` · `o1`

Variables de entorno requeridas: `OPENAI_API_KEY`

### anthropic
`claude-opus-4-7` · `claude-sonnet-4-6` · `claude-haiku-4-5` · `claude-opus-4-6` · `claude-sonnet-4-5` · `claude-opus-4-5` · `claude-opus-4-1`

Variables de entorno requeridas: `ANTHROPIC_API_KEY`

### google_genai
`gemini-2.5-pro` · `gemini-2.5-flash` · `gemini-2.5-flash-lite` · `gemini-3.1-pro-preview` · `gemini-3-flash-preview` · `gemini-3.1-flash-lite-preview` · `gemini-flash-latest`

Variables de entorno requeridas: `GOOGLE_API_KEY`

### ollama
`llama3.3` · `llama3.2` · `llama3.1` · `qwen3` · `qwen2.5:7b` · `qwen2.5` · `deepseek-r1` · `mistral` · `gemma2` · `phi3`

No requiere API key. Necesita el servidor Ollama en ejecución (`ollama serve`).

---

## Snippets

Escribe el prefijo y pulsa `Tab` (o selecciónalo de la lista de sugerencias) para insertar el esqueleto completo con los puntos de edición ya colocados.

| Prefijo | Descripción |
|---|---|
| `template` | Sistema completo de ejemplo con contexto, perfiles, dos agentes y estructura `layered` |
| `agent` | Declaración de agente con selector de proveedor |
| `mcpServer` | MCP Server genérico (rellena URL, transport y tools) |
| `mcpServer` | MCP Server preconfigurado para **Tavily** (búsqueda y extracción web) |
| `transition` | Transición condicional entre estructuras con selector de operador |
| `layered` | Estructura `layered` con dos capas |
| `centralized` | Estructura `centralized` con coordinador y dos agentes |
| `decentralized` | Estructura `decentralized` con dos agentes |

> `mcpServer` muestra dos opciones: una genérica y una preconfigurada para Tavily. VSCode las presenta juntas en la lista de sugerencias.

---

## Ayudas en tiempo real

**Hover (pasar el ratón):**

- Sobre las **palabras clave** del DSL (`agent`, `layered`, `from`, `openai`…): muestra una descripción y el esqueleto de sintaxis de esa construcción.
- Sobre los **nodos del modelo** (un agente concreto, un perfil, un atributo, una herramienta…): muestra un resumen con sus datos (proveedor y modelo de un agente, tipo y descripción de un atributo, etc.).

**Autocompletado:**

- Al escribir el campo `model` de un agente, coordinador o summarizer, el editor sugiere automáticamente los modelos disponibles para el `provider` declarado en ese nodo.
- Al referenciar un agente, perfil, atributo o herramienta, el editor filtra las sugerencias por tipo: solo aparecen los elementos válidos para esa posición.
- Las sugerencias de `model` aparecen al abrir las comillas `"` o al pulsar `Ctrl+Space` / `Cmd+Space`.

**Validación en tiempo real:**

- Los errores de bien-formedness se marcan con subrayado rojo mientras escribes, sin necesidad de compilar.

---

## Comandos de la extensión

| Botón | Comando | Descripción |
|---|---|---|
| 🚀 | `multiAgentDSL: Generar código LangGraph` | Genera el proyecto Python en `generated/` |
| 📊 | `multiAgentDSL: Ver diagrama del modelo` | Abre el diagrama del grafo |
| 📖 | `multiAgentDSL: Ayuda / Referencia` | Esta página |

Los botones aparecen en la barra del editor cuando hay un fichero `.mad` abierto.

---

## Ejecutar el código generado

El código se genera en una carpeta `generated/` junto al fichero `.mad`. Para ejecutarlo:

**1. Crear el entorno virtual (solo la primera vez)**

```bash
python3.12 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows
```

**2. Instalar dependencias**

```bash
pip install -r requirements.txt
```

**3. Configurar las API keys**

Copia `.env.template` a `.env` y rellena los valores:

```bash
cp .env.template .env
# edita .env con tus claves
```

**4a. Modo desarrollo (LangGraph Studio)**

Lanza un servidor local con interfaz gráfica para probar e inspeccionar el grafo:

```bash
langgraph dev
```

Abre el navegador en la URL que indique la terminal. Permite enviar mensajes, ver el estado del grafo paso a paso y depurar las transiciones.

**4b. Construir imagen Docker**

Genera una imagen Docker con el grafo expuesto como API:

```bash
langgraph build -t nombre-imagen
```
