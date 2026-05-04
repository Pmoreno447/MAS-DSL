import type { LLMMultiAgentSystem } from 'multi-agent-dsl-language';
import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from '../util.js';
import { resolveMessageConfig } from '../templates/reducers.js'
import { toPythonType } from '../util.js';

// ─── Generator ────────────────────────────────────────────────────────────────
// Genera un paquete `state/` con tres archivos:
//   - state/state.py     → solo el TypedDict
//   - state/reducers.py  → reducers / nodo de resumen (si la estrategia los pide)
//   - state/__init__.py  → re-exporta para que `from state import State, ...` siga
//                          siendo válido para el resto de generators.
export function stateGenerator(model: LLMMultiAgentSystem, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const stateDir = path.join(data.destination, 'state');

    const message = resolveMessageConfig(model.envirement.messages);

    const stateFile = expandToNode
`# state.py
from typing import Annotated, Optional
from typing_extensions import TypedDict
${message.stateImports}

class State(TypedDict):
    # Mensajes
    ${message.field}

    # Atributos
${joinToNode(model.envirement.attributes, attribute =>
`    ${attribute.name}: Optional[${toPythonType(attribute.type)}]`
, { appendNewLineIfNotEmpty: true })}
`.appendNewLineIfNotEmpty();

    const hasReducers = message.reducersBody.trim().length > 0;
    const reducersFile = hasReducers
        ? expandToNode`# reducers.py
${message.reducersImports}

${message.reducersBody}
`.appendNewLineIfNotEmpty()
        : null;

    const reducerExports = message.exports;
    const initFile = expandToNode`# __init__.py
from state.state import State
${reducerExports.length > 0 ? `from state.reducers import ${reducerExports.join(', ')}` : ''}

__all__ = [${['State', ...reducerExports].map(n => `"${n}"`).join(', ')}]
`.appendNewLineIfNotEmpty();

    if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
    }
    // Si quedaba un state.py de una generación previa con la estructura antigua,
    // lo eliminamos para evitar el clash entre módulo y paquete.
    const legacyStateFile = path.join(data.destination, 'state.py');
    if (fs.existsSync(legacyStateFile) && fs.statSync(legacyStateFile).isFile()) {
        fs.rmSync(legacyStateFile);
    }

    fs.writeFileSync(path.join(stateDir, 'state.py'), toString(stateFile));
    fs.writeFileSync(path.join(stateDir, '__init__.py'), toString(initFile));
    if (reducersFile) {
        fs.writeFileSync(path.join(stateDir, 'reducers.py'), toString(reducersFile));
    } else {
        // Limpia un reducers.py obsoleto si la estrategia cambió a "none".
        const stale = path.join(stateDir, 'reducers.py');
        if (fs.existsSync(stale)) fs.rmSync(stale);
    }

    return stateDir;
}
