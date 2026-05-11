import type { LLMMultiAgentSystem } from 'multi-agent-dsl-language';
import { isLayered, isCentralized, isSharedMessagePool, isDecentralized } from 'multi-agent-dsl-language';
import { generateLayeredSubgraph } from './layered.js';
import { generateCentralizedSubgraph } from './centralized.js';
import { generateDecentralizedSubgraph } from './decentralized.js';

export function generateSubgraphs(model: LLMMultiAgentSystem, destination: string): void {
    for (const structure of model.communicationStructures) {
        if (isLayered(structure))           { generateLayeredSubgraph(structure, destination); continue; }
        if (isCentralized(structure))       { generateCentralizedSubgraph(structure, destination); continue; }
        if (isDecentralized(structure))     { generateDecentralizedSubgraph(structure, destination); continue; }
        if (isSharedMessagePool(structure)) { continue; }
    }
}
