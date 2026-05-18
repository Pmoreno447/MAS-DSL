- [x] Añadir un `code` identificador a cada una de las 11 restricciones en tu validator (`R01`, `R02`, …). Esto lo haces **antes** de testear, porque los tests van a depender de esos códigos.
---

## Fase 1: Pruebas de validación (restricciones) — 2-3 horas

**Objetivo**: para cada una de las 11 restricciones, un test que falla y otro que pasa.

- [x] Crear `test/validating/restrictions.test.ts`.
- [x] Montar el helper `validate(modelText)` que parsea con Langium y devuelve los diagnósticos. Hazlo una vez, lo reutilizas todo el rato.
- [x] Por cada restricción R01..R11:
  - [x] Escribir el modelo inválido como string inline → assert que aparece el código de error correspondiente.
  - [x] Escribir el modelo válido equivalente → assert que no aparece ese código.
- [x] Lanzar `npm test` → todo verde.

**Salida de la fase**: ~22 tests pasando. Si alguna restricción no salta cuando debería, lo descubres aquí.

---

## Fase 2: Pruebas de generación — 3-5 horas

**Objetivo**: verificar que el código generado es correcto (estático) y que funciona (dinámico).

### 2.1 — Definir las dimensiones ortogonales (30 min)

- [x] Listar las dimensiones de tu DSL. Algo como:
- [x] Anotar los valores reales que soporta tu DSL en cada dimensión.

Dimensiones Detectadas:
- **Base de Datos:** Postgre, Mongo, EnMemoria.
- **Agentes:** OpenAI, Google, Ollama, Anthropic.
- **Tools:** Sin, Python, MCP
- **Mensajes:** Resumen, Trimeado, Mix, None

Contexto y Estructura de comunicación no se consideran dimensiones porque, en la práctica, resulta más natural y eficiente probarlas de forma integrada: en un mismo modelo se pueden ejercitar lectura y escritura simultáneamente, y explorar varias estructuras de comunicación a la vez aporta más valor que aislarlas en una dimensión independiente. Crear una dimensión "Combinada" sería demasiado abstracto y poco accionable.

Combinaciones totales: 3 × 4 × 3 × 4 = 144. **Inviable** probar todo

### 2.2 — Aplicar pairwise (30 min)

- [x] Instalar PICT, ACTS o usar una web de pairwise online (las hay gratis).
- [x] Meter las dimensiones, generar la matriz reducida.
- [x] Resultado: 17 combinaciones frente a 144.

**Resultado:**

| Base de Datos | Proveedor  | Tools  | Mensajes |
|---------------|------------|--------|----------|
| Postgre       | Anthropic  | Sin    | Trimeado |
| InMemory      | Anthropic  | MCP    | Mix      |
| Postgre       | Google     | Python | Resumen  |
| Mongo         | OpenAI     | MCP    | Trimeado |
| Mongo         | Ollama     | Python | Mix      |
| InMemory      | Ollama     | Sin    | Trimeado |
| Mongo         | Anthropic  | MCP    | Resumen  |
| InMemory      | Anthropic  | Python | None     |
| Mongo         | OpenAI     | Sin    | None     |
| Postgre       | Google     | MCP    | None     |
| Postgre       | Ollama     | MCP    | Resumen  |
| Postgre       | OpenAI     | Sin    | Mix      |
| InMemory      | Google     | Sin    | Mix      |
| Mongo         | Google     | Python | Trimeado |
| Postgre       | Ollama     | Python | None     |
| InMemory      | OpenAI     | Python | Resumen  |
| Postgre       | Google     | Sin    | Resumen  |

### 2.3 — Escribir los modelos representativos (2 h)

- [x] Postgre | Anthropic | Sin    | Trimeado
- [x] InMemory | Anthropic | MCP    | Mix
- [x] Postgre | Google    | Python | Resumen
- [x] Mongo   | OpenAI    | MCP    | Trimeado
- [x] Mongo   | Ollama    | Python | Mix
- [x] InMemory | Ollama   | Sin    | Trimeado
- [x] Mongo   | Anthropic | MCP    | Resumen
- [x] InMemory | Anthropic | Python | None
- [x] Mongo   | OpenAI    | Sin    | None
- [x] Postgre | Google    | MCP    | None
- [x] Postgre | Ollama    | MCP    | Resumen
- [x] Postgre | OpenAI    | Sin    | Mix
- [X] InMemory | Google   | Sin    | Mix
- [x] Mongo   | Google    | Python | Trimeado
- [x] Postgre | Ollama    | Python | None
- [x] InMemory | OpenAI   | Python | Resumen
- [x] Postgre | Google    | Sin    | Resumen


### 2.4 — Tests dinámicos con LLM real (1-2 h)

Crear codigo de los 18 modelos y probarlos. 

Modelos:

1. Correcto.
2. Fallo detectado, el nodo resumen se establece al final y se encadena junto al prompt en el siguiente turnos, dos nodos systemMessage seguidos, no son admitidos por Claude.
3. Fallo detectado, para google provider en requierements no introduce la dependencia 'langchain-google-genai', usa la de openAi. El resto de la ejecución fue correcta.
4. Correcto
5. Correcto
6. Fallo, para la estructura descentralizada, cuando el agente no tiene structured output, no rellena el campo messages. Para continuar la prueba lo arreglé manualmente y funcionó por lo que hay que cambiarlo en el generador de código.
7. Correcto.
8. Fallo, Anthropic no permite que un agente responda a otro, por lo que si un agente recibe en el campo messages que el ultimo mensaje es de un Agente, dará error. Esto puede afectar tanto a centralized como a decentralized.
9. Estructura descentralizada pero con OpenAI sorprendentemente, si funciona , por lo que en el caso 6 puede ser limitación del modelo local.
10. Ejecución correcta pero la estructura centralized tiende a no saber identificar cuando dejar de delegar en los agentes, por lo que posible solución sería que a las respuestas de agentes que pertenecen a estructuras centralizadashacer que se identifiquen. Aunque suele ejecutarse bien pero eso mejoraría la efectividad.
11. Correcto en ejecición pero lo mismo que lo anterior, con ollama no fue capaz de salir de la estructura.
12. Correcto
13. Correcto
14. Correcto
15. Correcto
16. Correcto
17. Fallo, mismo fallo que MD05, descentralizada con google.


Implementar arreglos:

- **Fallo requirements de google_genai (MD03).** El generador de requirements buscaba el proveedor "google" pero el valor correcto del DSL es "google_genai", por lo que no añadía `langchain-google-genai`. Corregida una línea en el generador de requirements.

- **Fallo summarizer + Anthropic (MD02, MD07).** El `summary_node` guardaba el resumen como un mensaje dentro de `state["messages"]`. Esto provocaba dos problemas: (1) en el turno siguiente quedaba encadenado con el `SystemMessage` del profile y Anthropic rechaza dos system messages seguidos; (2) el usuario veía el resumen renderizado como un mensaje más del chat.
  Solución definitiva: **el resumen deja de ser un mensaje y pasa a ser un campo del estado** (`summary: Optional[str]`). El `summary_node` comprime los mensajes antiguos, los borra del historial y escribe el texto en `state["summary"]`. Los agentes reciben ese resumen antepuesto a su profile mediante el helper `_system_prompt(profile, state)`, y el coordinador lo antepone a su bloque de contexto. Así el resumen es contexto del modelo pero nunca aparece en el chat ni colisiona con el system message. Toca `templates/reducers.ts`, `stateGenerator.ts`, `agentsGenerator.ts` y `edges/centralized.ts`.

- **Fallo descentralizada sin structured output (MD06, MD17).** Los agentes descentralizados sin tools devolvían `update={}` y no volcaban su respuesta a `state["messages"]`, por lo que el historial quedaba vacío y los siguientes agentes no tenían contexto. Se añadió un campo `message` al output estructurado del agente y ahora devuelven `update={"messages": [AIMessage(content=result.message, name="<agente>")]}` (`agentsGenerator.ts`).

- **Fallo Anthropic + coordinador (MD08).** Cuando un agente respondía y el grafo volvía al coordinador, el último mensaje de `state["messages"]` era un `AIMessage` y Anthropic exige que la conversación termine en turno humano.
  Solución: el coordinador deja de recibir `state["messages"]` crudo. Ahora recibe la conversación **serializada como texto** dentro de un único `HumanMessage`, mediante el helper `_format_conversation`. El input del coordinador termina siempre en un turno humano, así que funciona igual en todos los proveedores (no es un parche solo-Anthropic). El coordinador pasa a comportarse como un router que recibe la conversación como información, no como un participante del chat (`edges/centralized.ts`).

- **Mejora identificación de agentes (MD10, MD11).** En arquitectura centralizada el coordinador no sabía qué agente ya había actuado porque los `AIMessage` no se identificaban. Ahora los agentes de estructuras centralizadas etiquetan sus mensajes con `name="<agente>"`. Combinado con `_format_conversation`, el coordinador ve cada turno como `- agente1: ...` y sabe cuándo dejar de delegar (`agentsGenerator.ts`).


Tras esto ejecutan correctamente. Todos excepto el 17. Es problema de gemini.

**Salida de la fase**: snapshots cubriendo los casos pairwise + tests dinámicos verificando ejecución real. Anota cuántos tokens te consume una pasada completa, para mencionarlo en la memoria.

### 2.5 — Tests estáticos con snapshots (1 h)

- [x] Crear `test/generating/snapshots.test.ts`.
- [x] Por cada modelo: cargar fixture → generar código → `toMatchSnapshot()`.
- [x] Primera ejecución: revisas a ojo cada snapshot generado (esta vez sí lo miras tú, es la "verdad fundacional") y confirmas que la pinta es correcta.
- [x] A partir de ahí, cualquier cambio en el generador romperá los snapshots y te avisará.

---

## Fase 3: Pruebas manuales de la extensión — 30-45 min

**Objetivo**: dejar constancia de que el "maquillaje" funciona. No automatizar.
