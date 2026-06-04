# multiAgentDSL

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?logo=langchain&logoColor=white)
![VSCode](https://img.shields.io/badge/VSCode-007ACC?logo=visualstudiocode&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

> Trabajo de Fin de Grado — Universidad de Extremadura · Ingeniería Informática

DSL para definir sistemas multi-agente con IA y generar automáticamente el código Python listo para ejecutar con [LangGraph](https://www.langchain.com/langgraph). Escribe un modelo `.mad`, pulsa un botón y obtienes un proyecto Python completo con persistencia, herramientas y despliegue Docker.

---

## ¿Qué hace?

Defines tu sistema en un fichero `.mad`:

```
{
    context miSistema {
        attribute resultado type string description "Respuesta final"
        persistence Postgre
    }

    profile investigador description "Eres un investigador experto..."
    profile redactor description "Eres un redactor conciso..."

    mcpServer Tavily {
        url "https://mcp.tavily.com/mcp/?tavilyApiKey={key}"
        transport "streamable_http"
        apiKeyName "TAVILY_API_KEY"
        tools "tavily_search"
    }

    agent Researcher { provider anthropic  model "claude-sonnet-4-6"  profile investigador  tools Tavily }
    agent Writer     { provider openai     model "gpt-4o"             profile redactor      stateContext resultado }

    layered Pipeline {
        layer Researcher next Writer
        layer Writer
    }

    from START to Pipeline
    from Pipeline to END
}
```

Y la extensión genera el proyecto Python completo: grafo LangGraph, agentes, estado con checkpointer PostgreSQL, cliente MCP, requirements, `.env.template` y `langgraph.json` para `langgraph dev`.

---

## Instalación

### Opción A — Extensión VSCode (recomendado)

Instala **multiAgentDSL** desde el [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=pmorenoc.vscode-multiagentdsl). La extensión incluye el generador, el validador en tiempo real, autocompletado, hover y el diagrama del grafo. No requiere clonar el repositorio.

### Opción B — Desde el código fuente

```bash
git clone https://github.com/Pmoreno447/MAS-DSL
cd MAS-DSL
npm install
npm run build
```

Luego abre la carpeta en VSCode y pulsa `F5` para lanzar la extensión en modo desarrollo.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| DSL / Language Server | [Langium](https://langium.org/) + TypeScript |
| Extensión VSCode | VSCode Extension API + esbuild |
| Generador de código | TypeScript → Python / LangGraph |
| Pruebas | [Vitest](https://vitest.dev/) — unitarias, restricciones y snapshots |
| Ejecución del código generado | Python 3.12 + LangGraph CLI |

---

## Documentación

| Fichero | Contenido |
|---|---|
| [packages/extension/help.md](packages/extension/help.md) | **Referencia del lenguaje**: sintaxis completa, modelos disponibles por proveedor, snippets, autocompletado y cómo ejecutar el código generado |
| [examples/](examples/) | **Modelos de ejemplo** organizados en tres niveles (ver tabla debajo) |
| [docs/metamodelo.md](docs/metamodelo.md) | Esquema del metamodelo y descripción de cada clase |
| [docs/restricciones.md](docs/restricciones.md) | Catálogo de restricciones de bien-formedness R01–R15 |
| [docs/evolucionMetamodelo.md](docs/evolucionMetamodelo.md) | Historial de las 5 iteraciones del metamodelo |
| [docs/evolucionGenerador.md](docs/evolucionGenerador.md) | Desarrollo incremental del generador por módulo |
| [docs/evoluciónExtensión.md](docs/evoluciónExtensión.md) | Funcionalidades de la extensión y decisiones de diseño |
| [docs/faseTesting.md](docs/faseTesting.md) | Estrategia de pruebas: pairwise, snapshots y tests dinámicos |
| [docs/backlog.md](docs/backlog.md) | Tareas completadas y trabajos futuros priorizados |
| [docs/adr/](docs/adr/) | 11 Architecture Decision Records (contexto–decisión–consecuencias) |
| [docs/estructura.md](docs/estructura.md) | Estructura del proyecto y guía de desarrollo |

### Ejemplos

| Carpeta | Descripción |
|---|---|
| [examples/01-prototipado/](examples/01-prototipado/) | Modelos de la fase de diseño del metamodelo, escritos para validar la expresividad del lenguaje antes de desarrollar el generador |
| [examples/02-validacionGenerador/](examples/02-validacionGenerador/) | 8 modelos usados para validar el generador por proveedor y funcionalidad (Google, OpenAI, Anthropic, Ollama, summarize, trim, mix, decentralized) |
| [examples/03-casosDeUso/](examples/03-casosDeUso/) | 3 casos de uso reales: **customerService** (atención al cliente con centralized + layered), **legalAdvisor** (asesor legal con MCP + Postgre + summarizer), **incidentResponder** (respuesta a incidencias SRE con diagnóstico en paralelo + MongoDB) |
