# Evolución de la extensión de VSCode

## Metodología

La extensión de VSCode se construye sobre el *language server* generado por Langium. El esqueleto inicial (cliente LSP, asociación de la extensión `.mad`, resaltado básico) lo aporta el *scaffolding* de Langium; sobre esa base se han ido añadiendo de forma incremental funcionalidades orientadas a la experiencia de edición: ayudas en tiempo real, plantillas y acciones sobre el modelo.

El objetivo de estas mejoras es que escribir un modelo `.mad` sea guiado y difícil de equivocar: que el editor sugiera solo lo válido, documente las construcciones y ofrezca atajos para las tareas habituales (generar código, visualizar el sistema).

## Funcionalidades implementadas

| Funcionalidad | Mecanismo | Archivo principal |
|---|---|---|
| Resaltado de sintaxis | Gramática TextMate | `syntaxes/multi-agent-dsl.tmLanguage.json` |
| Autocompletado filtrado de referencias | `ScopeProvider` + `CompletionProvider` | `multi-agent-dsl-scope-provider.ts` |
| Sugerencia de modelos por proveedor | `CompletionProvider` | `multi-agent-dsl-completion-provider.ts` |
| Documentación al pasar el ratón (hover) | `HoverProvider` | `multi-agent-dsl-hover-provider.ts` |
| Snippets | Fichero de snippets de VSCode | `snippets/multi-agent-dsl.code-snippets` |
| Plantilla inicial | Modelo de ejemplo comentado | `examples/template.mad` |
| Botón "Generar código LangGraph" | Comando de la extensión | `extension/generate.ts` |
| Botón "Ver diagrama del modelo" | Comando de la extensión | `extension/preview.ts` |

---

## Resaltado de sintaxis

El editor colorea las palabras clave del DSL (`agent`, `profile`, `layered`, `from`...), las cadenas, los números y los identificadores. El resaltado se apoya en la gramática TextMate (`multi-agent-dsl.tmLanguage.json`), que `langium-cli` genera a partir de la gramática del lenguaje y que la extensión copia a su carpeta `syntaxes/` durante el *build* (`build:prepare`). Al ser un coloreado léxico (no semántico), es inmediato y no depende del *language server*.

## Autocompletado filtrado de referencias

El comportamiento por defecto de Langium ofrecía como sugerencias para una referencia cualquier identificador visible, incluyendo nombres que no encajaban con el tipo esperado. Para que el editor sugiera **solo las opciones válidas** se sobreescribió el `ScopeProvider` ([`multi-agent-dsl-scope-provider.ts`](../packages/language/src/multi-agent-dsl-scope-provider.ts)):

- Para cada referencia se consulta el **tipo esperado** (`getReferenceType`) y se recorre el documento (`streamAllContents`) quedándose únicamente con los nodos de ese tipo. Así, al referenciar un agente en una `layer` solo aparecen agentes, al referenciar un perfil solo aparecen perfiles, etc.
- Los atributos del estado (`stateContext`, `stateUpdate`, y el propio `attribute`) reciben un trato especial: su ámbito se restringe a los atributos declarados en el `context` del sistema actual, evitando que se filtren nombres ajenos.

El `CompletionProvider` registra el `ScopeProvider` mediante inyección de dependencias en [`multi-agent-dsl-module.ts`](../packages/language/src/multi-agent-dsl-module.ts).

## Sugerencia de modelos por proveedor

Al escribir el atributo `model` de un agente, el editor sugiere directamente los modelos disponibles **para el proveedor declarado** en ese agente. Se implementó sobreescribiendo `completionFor` en el [`CompletionProvider`](../packages/language/src/multi-agent-dsl-completion-provider.ts): cuando la posición del cursor corresponde a la asignación `model` dentro de un `Agent`, se consulta la lista de modelos del `provider` (`modelsFor`) y se ofrece cada uno como valor entrecomillado. Para el resto de posiciones se delega en el comportamiento por defecto.

## Documentación al pasar el ratón (hover)

Se añadió un `HoverProvider` ([`multi-agent-dsl-hover-provider.ts`](../packages/language/src/multi-agent-dsl-hover-provider.ts)) que muestra documentación contextual al situar el ratón sobre los elementos clave del modelo:

- **Sobre las palabras clave del DSL** (`agent`, `coordinator`, `layered`, `from`, proveedores, tipos de persistencia...): se muestra una breve descripción y, para las construcciones con bloque, un esqueleto de sintaxis comentado que sirve de recordatorio de los campos disponibles.
- **Sobre los nodos del modelo** (un `agent`, un `profile`, un `attribute`, una herramienta...): se muestra un resumen del nodo concreto con sus datos (proveedor y modelo de un agente, tipo y descripción de un atributo, etc.).

El proveedor se registra también vía inyección de dependencias en [`multi-agent-dsl-module.ts`](../packages/language/src/multi-agent-dsl-module.ts).

## Snippets

Se definió un fichero de snippets de VSCode ([`multi-agent-dsl.code-snippets`](../packages/extension/snippets/multi-agent-dsl.code-snippets)) con plantillas para las construcciones más habituales del lenguaje. Escribiendo un prefijo, el editor inserta el esqueleto completo con los puntos de edición (*tab stops*) ya colocados, reduciendo errores de sintaxis y tiempo de escritura. El fichero se declara en la sección `contributes.snippets` del `package.json` de la extensión.

## Plantilla inicial

Para ayudar al usuario a crear su primer modelo se añadió [`examples/template.mad`](../examples/template.mad): un modelo de ejemplo completo y comentado que recorre todas las construcciones del lenguaje (contexto, perfiles, herramientas, agentes, estructuras de comunicación y transiciones). Sirve como punto de partida y como referencia rápida de la sintaxis.

## Botón "Generar código LangGraph"

Se añadió un comando ([`generate.ts`](../packages/extension/src/extension/generate.ts)) accesible desde un botón en la barra del editor (solo visible con un fichero `.mad` abierto). El comando:

1. Guarda el fichero para trabajar sobre la última versión.
2. Parsea y valida el modelo con una instancia propia de Langium (`NodeFileSystem`).
3. Si hay errores, los notifica y aborta; el código solo se genera a partir de modelos válidos.
4. Invoca al generador (paquete `cli`) y vuelca el código Python en una carpeta `generated/` junto al `.mad`.
5. Abre el `graph.py` resultante.

## Botón "Ver diagrama del modelo"

Se añadió un comando ([`preview.ts`](../packages/extension/src/extension/preview.ts)) que visualiza el sistema multi-agente como un diagrama: cada estructura de comunicación se dibuja como un subgrafo con sus agentes, y las transiciones entre estructuras como flechas (incluyendo las condiciones).

El comando parsea el `.mad`, genera el texto del diagrama en sintaxis **Mermaid** ([`mermaid.ts`](../packages/extension/src/extension/mermaid.ts)), lo escribe en un fichero Markdown temporal con un bloque ` ```mermaid ` y lo abre en el **preview de Markdown nativo de VSCode**. Al guardar el `.mad`, el diagrama se regenera automáticamente.

El renderizado del bloque Mermaid lo aporta la extensión [`bierner.markdown-mermaid`](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid), declarada como `extensionDependency` en el `package.json`, por lo que VSCode la instala de forma automática junto con esta extensión.

> **Nota de implementación.** La primera versión usaba un *webview* propio con Mermaid empaquetado, pero ese enfoque resultó inestable: el contenido se generaba correctamente (el SVG se producía con sus dimensiones reales) pero el *webview* no llegaba a pintarse en pantalla. Se descartó en favor del preview de Markdown nativo, que es el componente que VSCode ya tiene probado para esta tarea y elimina la necesidad de mantener un *webview* y de empaquetar la librería de Mermaid.
