## Dimensiones ortogonales identificadas

- **Provider del modelo:** OpenAI, Anthropic, Gemini
- **Gestión de mensajes:** None, Summarize, Trim, Mix
- **Estructura de comunicación:** Layered, Centralized, Mixto
- **Herramientas:** None, Python, MCP
- **Bifurcaciones:** None, Int, String, Bool
- **Persistencia:** InMemory, Mongo, Postgres

El plan es realizar un testing combinatorio, pero este se llevará a cabo cuando tengamos todo implementado. Mientras tanto se ha llevado a cabo esta fase de testeo para tantear aproximadamente que todo esté bien implementado.

Se han prototipado los siguientes modelos con el fin de probar combinaciones puntuales de features y detectar regresiones de forma temprana mientras el generador continúa evolucionando.

## Modelos

### Test 01
* **Nombre:** googleAgents
* **Objetivo:** Probar todas las opciones de configuración para el proveedor Google.
* **Correcciones:**
    * Nombre de provider equivocado, cambiado por "google_genai".

### Test 02
* **Nombre:** openAiAgents
* **Objetivo:** Probar todas las opciones de configuración para el proveedor openAi.
* **Correcciones:** nada

### Test 03
* **Nombre:** anthropicAgents
* **Objetivo:** Probar todas las opciones de configuración para el proveedor anthropic.
* **Correcciones:** nada

### Test 04
* **Nombre:** ollamaAgents
* **Objetivo:** Probar todas las opciones de configuración para el proveedor ollama.
* **Correcciones:** nada

### Test 05
* **Nombre:** summarizeAgent
* **Objetivo:** Probar la configuración de resumen del campo mensaje.
* **Correcciones:** 
    * No se aplicaba la validación de modelo en el caso de summarize y por extensión a mix tampoco.
    * El resumido funcionaba pero el funcionamiento no era del todo optimo, resumia el resumen si se lllamaba varias veces, solo se tenia en cuenta los mensajes str y además el prompt era demasiado pobre. Esto también se solucionó para Mix.
    * Se ha pasado de generar un "State.py" a un paquete state donde el estado y los reducers se generan por separado. Simplemente mejora la legibilidad del código.

### Test 06
* **Nombre:** trimAgent
* **Objetivo:** Probar la configuración de trimeado del campo mensaje.
* **Correcciones:** nada

### Test 07
* **Nombre:** mixAgent
* **Objetivo:** Probar la configuración de trimeado y resumen combinadas, del campo mensaje.
* **Correcciones:** nada

Las herrramientas, distintas estructuras de comunicaciones y los métodos de persistencia ya han sido previamente testeados por lo que se pasa a desarrollar un módelo que represente un caso de uso real.