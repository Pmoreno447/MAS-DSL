import type { Decentralized } from 'multi-agent-dsl-language';
import { expandToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateNodeName, subgraphDefinitionName } from '../../util.js';

export function generateDecentralizedSubgraph(decentralized: Decentralized, destination: string): string {
    const subgraphDir = path.join(destination, 'subgraph');
    const filePath = path.join(subgraphDir, `${decentralized.name}.py`);

    const agents = decentralized.agents.map(a => a.ref!);
    const entryAgent = agents[0];

    const nodeImports = agents.map(a => generateNodeName(a)).join(', ');

    const addNodes = agents
        .map(a => `builder.add_node("${a.name.toLowerCase()}", ${generateNodeName(a)})`)
        .join('\n    ');

    const definitionSubgraph = subgraphDefinitionName(decentralized) + '()';

    const fileNode = expandToNode`
from langgraph.graph import StateGraph, START, END
from state import State
from agents import ${nodeImports}

def ${definitionSubgraph}:
    builder = StateGraph(State)

    ${addNodes}

    builder.add_edge(START, "${entryAgent.name.toLowerCase()}")

    return builder.compile()
`.appendNewLineIfNotEmpty();

    if (!fs.existsSync(subgraphDir)) {
        fs.mkdirSync(subgraphDir, { recursive: true });
    }
    fs.writeFileSync(filePath, toString(fileNode));
    return filePath;
}
