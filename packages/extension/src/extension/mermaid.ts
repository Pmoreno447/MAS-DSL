import type { CommTransition, LLMMultiAgentSystem } from 'multi-agent-dsl-language';
import { isCentralized, isLayered } from 'multi-agent-dsl-language';

// Convierte un identificador en un id válido para Mermaid.
function sid(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

// Etiqueta de una transición condicional: "atributo operador valor".
function conditionLabel(t: CommTransition): string | undefined {
    if (!t.condition) return undefined;
    const attr = t.condition.attribute.ref?.name ?? '?';
    const value = t.condition.value as { value?: unknown };
    return `${attr} ${t.condition.operator} ${String(value.value ?? '?')}`;
}

/**
 * Genera el texto Mermaid (flowchart) de un sistema multi-agente:
 * cada estructura de comunicación es un subgrafo con sus agentes dentro,
 * y las transiciones se dibujan como flechas entre estructuras.
 */
export function modelToMermaid(model: LLMMultiAgentSystem): string {
    const lines: string[] = ['flowchart TD'];

    if (model.transitions.some(t => t.isStart)) {
        lines.push('  START((START))');
    }
    if (model.transitions.some(t => t.isEnd)) {
        lines.push('  END((END))');
    }

    for (const struct of model.communicationStructures) {
        const s = sid(struct.name);
        lines.push(`  subgraph ${s}["${struct.name}"]`);

        if (isLayered(struct)) {
            for (const layer of struct.layers) {
                const a = layer.agent?.ref?.name;
                if (a) lines.push(`    ${s}_${sid(a)}["${a}"]`);
            }
        } else if (isCentralized(struct)) {
            const coord = struct.coordinator?.ref?.name;
            if (coord) lines.push(`    ${s}_${sid(coord)}{{"${coord}"}}`);
            for (const ag of struct.agents) {
                const a = ag.ref?.name;
                if (a) lines.push(`    ${s}_${sid(a)}["${a}"]`);
            }
        } else {
            // decentralized / shared_message_pool
            for (const ag of struct.agents) {
                const a = ag.ref?.name;
                if (a) lines.push(`    ${s}_${sid(a)}["${a}"]`);
            }
        }
        lines.push('  end');

        // Aristas internas: cadena next en layered, coordinador -> agentes en centralized.
        if (isLayered(struct)) {
            for (const layer of struct.layers) {
                const a = layer.agent?.ref?.name;
                const n = layer.next?.ref?.name;
                if (a && n) lines.push(`  ${s}_${sid(a)} --> ${s}_${sid(n)}`);
            }
        } else if (isCentralized(struct)) {
            const coord = struct.coordinator?.ref?.name;
            if (coord) {
                for (const ag of struct.agents) {
                    const a = ag.ref?.name;
                    if (a) lines.push(`  ${s}_${sid(coord)} --> ${s}_${sid(a)}`);
                }
            }
        }
    }

    // Transiciones entre estructuras de comunicación.
    for (const t of model.transitions) {
        const src = t.isStart ? 'START' : t.source?.ref ? sid(t.source.ref.name) : undefined;
        const tgt = t.isEnd ? 'END' : t.target?.ref ? sid(t.target.ref.name) : undefined;
        if (!src || !tgt) continue;
        const label = conditionLabel(t);
        lines.push(label ? `  ${src} -->|"${label}"| ${tgt}` : `  ${src} --> ${tgt}`);
    }

    return lines.join('\n');
}
