import type { AstNode, MaybePromise } from 'langium';
import { GrammarAST } from 'langium';
import { AstNodeHoverProvider } from 'langium/lsp';
import type { Hover } from 'vscode-languageserver';
import {
    isAgent, isAttribute, isCoordinator, isMCPServer, isProfile, isPythonTool, isSummarizer
} from './generated/ast.js';

// Bloque de código con la sintaxis de la construcción.
function syntax(code: string): string {
    return '```multi-agent-dsl\n' + code.trim() + '\n```';
}

// Documentación mostrada al pasar el ratón sobre cada palabra clave del DSL.
// Las construcciones con bloque muestran su esqueleto de sintaxis con comentarios.
const KEYWORD_DOCS: Record<string, string> = {
    // Proveedores LLM
    openai: 'Proveedor **OpenAI**. Requiere la variable de entorno `OPENAI_API_KEY`.',
    anthropic: 'Proveedor **Anthropic Claude**. Requiere la variable de entorno `ANTHROPIC_API_KEY`.',
    google_genai: 'Proveedor **Google Generative AI**. Requiere la variable de entorno `GOOGLE_API_KEY`.',
    ollama: 'Proveedor **Ollama** (modelos locales). No requiere API key; necesita el servidor de Ollama en ejecución.',

    // Actores
    agent: 'Declara un **agente**: una unidad LLM.\n\n' + syntax(`
agent Nombre {
    provider openai            // openai | anthropic | ollama | google_genai
    model "gpt-4o"             // modelo del proveedor
    profile profile1           // perfil (system prompt)
    temperature 0.0            // opcional: 0.0 determinista - 1.0 creativo
    description "..."          // opcional
    stateContext attr1         // opcional: atributos que lee
    stateUpdate attr2          // opcional: atributos que escribe
    statusMessage "..."        // opcional: mensaje para indicar que está haciendo
    maxToken 3000              // opcional
    timeOut 100                // opcional
    maxRetries 2               // opcional
    tools tool1, tool2         // opcional
}`),
    coordinator: 'Declara un **coordinador**: agente que orquesta a otros en una estructura `centralized`.\n\n' + syntax(`
coordinator Nombre {
    provider openai
    model "gpt-4o"
    profile profile1
    temperature 0.0            // opcional
}`),
    summarizer: 'Declara un **summarizer**: agente que resume la conversación. Solo puede haber uno.\n\n' + syntax(`
summarizer Nombre {
    provider openai
    model "gpt-4o"
    profile profile1
    temperature 0.0            // opcional
    tokenTrigger 2000          // opcional: umbral de tokens para resumir
}`),
    profile: 'Declara un **perfil**: el prompt de sistema reutilizable por uno o varios agentes.\n\n' + syntax(`
profile nombre description "system prompt del agente"`),
    context: 'Declara el **contexto** del sistema: atributos del estado y persistencia.\n\n' + syntax(`
context Nombre {
    attribute info type string description "..."
    maxMessages 3              // opcional
    persistence inMemorySave   // inMemorySave | MongoDB | Postgre
}`),

    // Herramientas
    pythonTool: 'Declara una **herramienta Python** local, importada desde un módulo.\n\n' + syntax(`
pythonTool nombre modulePath "ruta/del/modulo"`),
    mcpServer: 'Declara una **herramienta MCP Server** remota accesible vía protocolo MCP.\n\n' + syntax(`
mcpServer Nombre {
    url "https://mcp.example.com/mcp/"
    transport "streamable_http"
    apiKeyName "API_KEY"       // opcional
    tools "tool1", "tool2"
}`),

    // Estructuras de comunicación
    layered: 'Estructura de comunicación **por capas**: los agentes se ejecutan en cadena mediante `next`.\n\n' + syntax(`
layered Nombre {
    layer Agente1 next Agente2
    layer Agente2
}`),
    centralized: 'Estructura de comunicación **centralizada**: un coordinador dirige a varios agentes.\n\n' + syntax(`
centralized Nombre {
    coordinator Coordinador
    agents Agente1, Agente2
}`),
    decentralized: 'Estructura de comunicación **descentralizada**: agentes sin jerarquía (mínimo 2).\n\n' + syntax(`
decentralized Nombre {
    agents Agente1, Agente2
}`),

    // Transiciones
    from: 'Inicia una **transición** entre estructuras de comunicación.\n\n' + syntax(`
from START to estructura1
from estructura1 to estructura2 when atributo equal True
from estructura1 to END`),

    // Atributos / propiedades
    temperature: 'Aleatoriedad de la generación. Valor entre `0.0` (determinista) y `1.0` (creativo).',
    maxToken: 'Número máximo de tokens de la respuesta del agente. Debe ser mayor que 0.',
    timeOut: 'Tiempo máximo de espera del agente en segundos. Debe ser mayor que 0.',
    maxRetries: 'Número de reintentos del agente ante un fallo. Debe ser mayor que 0.',
    tokenTrigger: 'Umbral de tokens a partir del cual el summarizer resume. Debe ser mayor que 0.',
    maxMessages: 'Número máximo de mensajes retenidos en el contexto. Debe ser mayor que 0.',

    // Persistencia
    inMemorySave: 'Persistencia **en memoria**: el estado se pierde al terminar la ejecución.',
    MongoDB: 'Persistencia en **MongoDB**: el estado se guarda mediante un checkpointer de MongoDB.',
    Postgre: 'Persistencia en **PostgreSQL**: el estado se guarda mediante un checkpointer de Postgres.',
};

export class MultiAgentDslHoverProvider extends AstNodeHoverProvider {

    protected getAstNodeHoverContent(node: AstNode): MaybePromise<string | undefined> {
        if (isAgent(node)) {
            return `**agent** \`${node.name}\` — provider \`${node.provider}\`, model \`${node.model}\`.`;
        }
        if (isCoordinator(node)) {
            return `**coordinator** \`${node.name}\` — provider \`${node.provider}\`, model \`${node.model}\`.`;
        }
        if (isSummarizer(node)) {
            return `**summarizer** \`${node.name}\` — provider \`${node.provider}\`, model \`${node.model}\`.`;
        }
        if (isProfile(node)) {
            return `**profile** \`${node.name}\`\n\n${node.profileDescription}`;
        }
        if (isAttribute(node)) {
            return `**attribute** \`${node.name}\` : \`${node.type}\` — ${node.description}`;
        }
        if (isPythonTool(node)) {
            return `**pythonTool** \`${node.name}\` — modulePath \`${node.modulePath}\`.`;
        }
        if (isMCPServer(node)) {
            return `**mcpServer** \`${node.name}\` — \`${node.url}\`.`;
        }
        return undefined;
    }

    protected override getKeywordHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
        if (GrammarAST.isKeyword(node)) {
            const doc = KEYWORD_DOCS[node.value];
            if (doc) {
                return { contents: { kind: 'markdown', value: doc } };
            }
        }
        return super.getKeywordHoverContent(node);
    }
}
