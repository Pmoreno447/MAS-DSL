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

- [ ] Listar las dimensiones de tu DSL. Algo como:
  - Proveedor LLM: `claude`, `openai`, …
  - Herramientas: `ninguna`, `función`, `mcp`
  - Topología: `lineal`, `condicional`, `ciclo`
  - Estado: `default`, `custom`
- [ ] Anotar los valores reales que soporta tu DSL en cada dimensión.

### 2.2 — Aplicar pairwise (30 min)

- [ ] Instalar PICT, ACTS o usar una web de pairwise online (las hay gratis).
- [ ] Meter las dimensiones, generar la matriz reducida.
- [ ] Guardar la tabla resultante (te servirá para la memoria, sección Pruebas).
- [ ] Resultado típico: 8-12 combinaciones en vez de las decenas que saldrían por fuerza bruta.

### 2.3 — Escribir los modelos representativos (1 h)

- [ ] Para cada fila de la matriz pairwise, escribir un modelo `.tudsl` en `test/fixtures/`. Nómbralos descriptivamente: `claude_tool_lineal.tudsl`, `openai_mcp_condicional.tudsl`, etc.

### 2.4 — Tests estáticos con snapshots (1 h)

- [ ] Crear `test/generating/snapshots.test.ts`.
- [ ] Por cada modelo: cargar fixture → generar código → `toMatchSnapshot()`.
- [ ] Primera ejecución: revisas a ojo cada snapshot generado (esta vez sí lo miras tú, es la "verdad fundacional") y confirmas que la pinta es correcta.
- [ ] A partir de ahí, cualquier cambio en el generador romperá los snapshots y te avisará.

### 2.5 — Tests dinámicos con LLM real (1-2 h)

- [ ] Asegurar que las API keys están en `.env` (no comitearlas).
- [ ] Crear `test/e2e/execution.test.ts`.
- [ ] Asegurar que tu generador produce un `.py` ejecutable de un tirón (con un `if __name__ == "__main__":` que acepte un input). Si no lo hace, añadir esa parte al generador.
- [ ] Por cada modelo de la matriz:
  - [ ] Generar el `.py` a un fichero temporal.
  - [ ] Ejecutar con `execSync` pasando un input fijo.
  - [ ] Aserción flexible sobre el output: `toContain`, `toMatch`, o verificar marcador de estructura (ej. `FINAL_NODE: end`).
- [ ] Subir el timeout de los tests a 30-60s.
- [ ] Marcar este describe como "slow" o detrás de una flag, para no correrlo en cada cambio: `describe.skipIf(!process.env.RUN_E2E)`.

**Salida de la fase**: snapshots cubriendo los casos pairwise + tests dinámicos verificando ejecución real. Anota cuántos tokens te consume una pasada completa, para mencionarlo en la memoria.

---

## Fase 3: Pruebas manuales de la extensión — 30-45 min

**Objetivo**: dejar constancia de que el "maquillaje" funciona. No automatizar.

- [ ] Crear un documento `test/manual-checklist.md` con la siguiente lista, y rellenar:
  - [ ] Abrir un `.tudsl` → los colores del resaltado se aplican (capturar screenshot).
  - [ ] Escribir una palabra clave parcial → el autocompletado sugiere lo esperado (screenshot).
  - [ ] Mirar el explorador de archivos → el icono custom aparece (screenshot).
  - [ ] Escribir un modelo con un error de los R01..R11 → la línea se subraya en rojo y al pasar el ratón aparece el mensaje (screenshot).
  - [ ] Ejecutar el comando "Generar código" → aparece el `.py` (screenshot).
- [ ] Las capturas te servirán directamente para la memoria.

---

## Cierre del día — 15 min

- [ ] `npm test` completo → todo verde.
- [ ] Anotar números finales: cuántos tests por fase, tiempo total de ejecución, coste aproximado en tokens.
- [ ] Apuntar lo que no haya quedado bien para retomar (ej: "el test de OpenAI+MCP tarda 40s, mirar timeout").
