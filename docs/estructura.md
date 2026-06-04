# Configuración del entorno de desarrollo

## Estructura del proyecto

El proyecto sigue una arquitectura de monorepo con workspaces de npm, organizado en tres paquetes principales:

```
multiAgentDSL/
├── packages/
│   ├── language/     ← Gramática del DSL y lógica del generador
│   ├── cli/          ← Interfaz de línea de comandos
│   └── extension/    ← Extensión de VSCode
├── examples/
│   ├── 01-prototipado/          ← Modelos de validación del metamodelo
│   ├── 02-validacionGenerador/  ← Modelos para validar el generador por proveedor/feature
│   └── 03-casosDeUso/           ← Casos de uso reales (customerService, legalAdvisor, incidentResponder)
├── docs/             ← Documentación y prototipos
└── package.json      ← Configuración raíz del workspace
```

## Gestión de la compilación

El flujo de compilación de un proyecto Langium implica dos pasos diferenciados:

1. **Generación del AST** (`langium:generate`) → Lee la gramática `.langium` y genera automáticamente los tipos TypeScript que representan el árbol sintáctico abstracto del DSL. Este paso solo es estrictamente necesario cuando se modifica la gramática.

2. **Compilación TypeScript** (`tsc`) → Compila todos los paquetes del workspace a JavaScript ejecutable.

En proyectos de mayor escala, estos dos pasos se mantienen separados para evitar regenerar el AST innecesariamente, ya que la gramática suele ser estable. Sin embargo, dado que el proyecto se encuentra en una fase activa de desarrollo del metamodelo en la que la gramática evoluciona con frecuencia, se ha optado por unificar ambos pasos en un único comando de compilación, modificando el script `build` en el `package.json` raíz:

```json
"build": "npm run langium:generate && tsc -b tsconfig.build.json && npm run build --workspaces"
```

Esta decisión simplifica el flujo de trabajo durante el desarrollo, evitando errores difíciles de diagnosticar causados por un AST desactualizado respecto a la gramática. El coste asumido es un tiempo de compilación ligeramente superior, lo cual resulta aceptable en el contexto de un TFG.

## Flujo de trabajo habitual

```bash
# Compilar todo (gramática + TypeScript + extensión + CLI)
npm run build

# Ejecutar el generador sobre un modelo
node packages/cli/bin/cli.js generate examples/miModelo.mad

# Ejecutar el generador especificando carpeta de salida
node packages/cli/bin/cli.js generate examples/miModelo.mad -d ./output
```

## Estructura de la documentación

La carpeta `docs/` contiene toda la documentación de diseño y desarrollo del proyecto:

```
docs/
├── estructura.md              ← Este archivo
├── metamodelo.md
├── restricciones.md
├── evolucionMetamodelo.md
├── evolucionGenerador.md
├── evoluciónExtensión.md
├── faseTesting.md
├── backlog.md
├── comandosCheckpointDB.md
├── adr/
│   ├── 001-compilacionUnificada.md
│   ├── 002-summarize&mixReducer.md   (deprecado, ver 011)
│   ├── 003-scopeProviderAttributes.md
│   ├── 004-generadorEdges.md
│   ├── 005-modelosPorProvider.md
│   ├── 006-eliminacionEndPointTool.md
│   ├── 007-toolNameEnMcpTool.md
│   ├── 008-failFastMcpToolLookup.md
│   ├── 009-baseModelComoToolYWhileLoop.md
│   ├── 010-estadoPorSubgrafo.md
│   └── 011-summarize&mixUpdate.md
└── prototipos/
    ├── cvReviewer/
    │   ├── cvReviewer.mad
    │   ├── cvReviewer.md
    │   └── code/
    └── research-assistant/
        ├── research-assistant.mad
        ├── research-assistant.md
        └── code/
```

### `metamodelo.md`

Esquema del metamodelo y descripción de cada clase y sus relaciones.

### `restricciones.md`

Catálogo de restricciones de bien-formedness (análogas a restricciones OCL) identificadas durante el desarrollo. Distingue entre restricciones implementadas en el validator de Langium (R01–R15) y restricciones pendientes.

### `evolucionMetamodelo.md`

Registro completo del proceso iterativo de diseño del metamodelo, desde la v1 (basada en Barriga et al.) hasta la v5 actual. Documenta para cada versión los cambios introducidos, las limitaciones detectadas y las decisiones tomadas.

### `evolucionGenerador.md`

Registro del desarrollo incremental del generador de código. Documenta el estado de cada módulo generado (`prompt.py`, `config.py`, `state.py`, `agents.py`, `graph.py`, `tools/`), las decisiones y limitaciones de cada iteración, y los cambios que el generador motivó en el metamodelo.

### `evoluciónExtensión.md`

Registro del desarrollo incremental de la extensión de VSCode. Documenta las funcionalidades añadidas (resaltado, autocompletado, hover, snippets, generación, diagrama, MCP, warnings), las decisiones de diseño y las alternativas descartadas (como el webview propio para el diagrama).

### `faseTesting.md`

Documentación de la fase de pruebas del proyecto: restricciones del validator (R01–R15), estrategia pairwise para el generador (17 fixtures de 144 combinaciones posibles), resultados de los tests dinámicos con LLMs reales y bugs encontrados, y tests de snapshot como regresión estática.

### `backlog.md`

Lista priorizada de tareas pendientes y completadas, clasificadas por prioridad. Incluye trabajos futuros como `SharedMessagePool`, Human in the Loop, literales en el estado y segmentación de módulos por subgrafo.

### `comandosCheckpointDB.md`

Referencia rápida de comandos `docker exec` para inspeccionar el estado de los checkpoints en los contenedores de LangGraph (MongoDB y PostgreSQL).

### `adr/` — Architecture Decision Records

Registros de decisiones arquitectónicas tomadas durante el desarrollo. Cada ADR sigue la estructura contexto–decisión–consecuencias:

- **`001`** — Unificación de `langium:generate` y `tsc` en un único `npm run build`.
- **`002`** — *(Deprecado, ver 011)* Posición del nodo summarize; descartado por ambigüedad en grafos multi-estructura.
- **`003`** — `ScopeProvider` personalizado para resolver referencias `stateContext`/`stateUpdate` a `Attribute`.
- **`004`** — Separación del generador de edges en módulos por estructura de comunicación.
- **`005`** — Separación provider/model y catálogo de modelos extraído de la gramática hacia `models.ts`.
- **`006`** — Eliminación de `EndPointTool` del metamodelo; las tools se referencian directamente por ID.
- **`007`** — Granularidad por tool en `MCPServer` mediante el campo `tools` como lista de strings.
- **`008`** — Fail-fast en la resolución de tools MCP al importar `mcpClients.py`.
- **`009`** — `BaseModel` como tool y while-loop unificado para nodos con herramientas.
- **`010`** — Estado compartido para subgrafos frente a estado independiente por subgrafo.
- **`011`** — Posición y mecanismo definitivos del nodo Summarize: campo `summary` en el estado, no mensaje.

### `prototipos/` — Prototipos de validación del metamodelo

Sistemas multiagente implementados manualmente para validar la expresividad del metamodelo antes de desarrollar el generador. Cada prototipo incluye el modelo `.mad`, el código Python y un informe de evaluación:

- **`research-assistant/`** — Asistente de investigación con estructura *centralized* y herramientas MCP. Su informe identificó limitaciones en flujo de control, composición de estructuras y personalización de agentes.
- **`cvReviewer/`** — Pipeline de evaluación de candidatos con estructura *layered* y herramienta Python local. Su informe reforzó la necesidad de estado compartido mediante *structured outputs*.

## Notas sobre dependencias

Durante la configuración inicial se detectaron vulnerabilidades en la dependencia `lodash` utilizada por `langium-cli`. La solución propuesta por npm (`npm audit fix --force`) fue descartada ya que implicaba una bajada de versión de `langium-cli` a una versión con cambios disruptivos. Dado que las vulnerabilidades afectan únicamente a herramientas de desarrollo y no al código generado, se optó por mantener la versión actual y no aplicar la corrección forzada.