export const R14_INV = `{
    context c {
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    mcpServer Tavily1 {
        url "https://mcp.taddvily.com/mcp/?tavilyApiKey={key}"
        transport "streamable_http"
        apiKeyName "tavisly"
        tools "tavily_search"
    }

    mcpServer Tavily2 {
        url "https://mcp.tassvily.com/mcp/?tavilyApiKey={key}"
        transport "streamable_http"
        apiKeyName "tavilay"
        tools "tavily_extract"
    }

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    summarizer Resumidor {
        provider anthropic
        model "claude-sonnet-4-6"
        profile p
    }

    layered l {
        layer NombreAgente
    }
    

    from START to l
    from l to END
}`