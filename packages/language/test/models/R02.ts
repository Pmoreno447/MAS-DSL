export const R02_INV = `
{
    context c {
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    mcpServer Tavily {
        url "https://mcp.tavily.com/mcp/?tavilyApiKey={key}"
        transport "streamable_http"
        tools "tavily_search"
    }

    mcpServer Tavily {
        url "https://mcp.tavily.com/mcp/?tavilyApiKey={key}"
        transport "streamable_http"
        tools "tavily_extract"
    }

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }
    

    from START to l
    from l to END
}`

export const R02 = `
{
    context c {
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    mcpServer Tavily {
        url "https://mcp.taddvily.com/mcp/?tavilyApiKey={key}"
        transport "streamable_http"
        tools "tavily_search"
    }

    mcpServer Tavily {
        url "https://mcp.tassvily.com/mcp/?tavilyApiKey={key}"
        transport "streamable_http"
        tools "tavily_extract"
    }

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }
    

    from START to l
    from l to END
}`