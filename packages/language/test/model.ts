export const MODELO_BASE = `
{
    context c {
        persistence inMemorySave
    }

    profile p description "Un Prompt"

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

export const R01_INV = `
{
    context c {
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to END
}`

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

export const R03_INV = `
{
    context c {
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from START to l2
    from l2 to l
    from l to END
}`

export const R04_INV = `
{
    context c {
        attribute atr type boolean description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to l2 when atr equal True
    from l to l2 when atr equal False 
    from l2 to END
}`

export const R04 = `
{
    context c {
        attribute atr type boolean description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to l2 when atr equal True
    from l to END 
    from l2 to END
}`

export const R05_INV = `
{
    context c {
        attribute atr type boolean description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to l2 when atr equal True
    from l2 to END
}`

export const R06_INV_INT = `
{
    context c {
        attribute atr type int description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to l2 when atr equal True
    from l to END
    from l2 to END
}`

export const R06_INV_STR = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to l2 when atr equal 123
    from l to END
    from l2 to END
}`

export const R06_INV_BOOL = `
{
    context c {
        attribute atr type boolean description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to l2 when atr equal 15
    from l to END
    from l2 to END
}`

export const R06_INT = `
{
    context c {
        attribute atr type int description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to l2 when atr equal 15
    from l to END
    from l2 to END
}`

export const R06_STR = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to l2 when atr equal "Test"
    from l to END
    from l2 to END
}`

export const R06_BOOL = `
{
    context c {
        attribute atr type boolean description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to l2 when atr equal True
    from l to END
    from l2 to END
}`

export const R07_INV = `{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    layered l {
        layer NombreAgente
    }

    layered l2 {
        layer NombreAgente
    }
    

    from START to l
    from l to l2 when atr equal "Test"
    from l to l2
    from l to END
    from l2 to END
}`

export const R08_INV_SUP = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
        temperature 1.01
    }

    layered l {
        layer NombreAgente
    }
    
    from START to l
    from l to END
}`

export const R08_INV_INF = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
        temperature 2.5
    }

    layered l {
        layer NombreAgente
    }
    
    from START to l
    from l to END
}`

export const R08_SUP = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
        temperature 1.0
    }

    layered l {
        layer NombreAgente
    }
    
    from START to l
    from l to END
}`

export const R08_INF = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
        temperature 0.0
    }

    layered l {
        layer NombreAgente
    }
    
    from START to l
    from l to END
}`

export const R09_INV = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    summarizer ResumenInicio {
        provider openai
        model "gpt-4o"
        profile p
    }

    summarizer ResumenInicioDos {
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

export const R09 = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
    }

    summarizer ResumenInicio {
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


export const R10_INV_maxMesages = `
{
    context c {
        attribute atr type string description "atributo"
        maxMessages 0
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p  
    }

    summarizer ResumenInicio {
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

export const R10_INV_tokenTrigger = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p  
    }

    summarizer ResumenInicio {
        provider openai
        model "gpt-4o"
        profile p
        tokenTrigger 0
    }

    layered l {
        layer NombreAgente
    }
    
    from START to l
    from l to END
}`

export const R10_INV_maxToken = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
        maxToken 0
    }

    summarizer ResumenInicio {
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

export const R10_INV_timeOut = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
        timeOut 0    
    }

    summarizer ResumenInicio {
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

export const R10_INV_maxRetries = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
        maxRetries 0     
    }

    summarizer ResumenInicio {
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

export const R10 = `
{
    context c {
        attribute atr type string description "atributo"
        maxMessages 5
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent NombreAgente {
        provider openai
        model "gpt-4o"
        profile p
        maxToken 4000
        timeOut 4
        maxRetries 4        
    }

    summarizer ResumenInicio {
        provider openai
        model "gpt-4o"
        profile p
        tokenTrigger 4500
    }

    layered l {
        layer NombreAgente
    }
    
    from START to l
    from l to END
}`

export const R11_INV = `
{
    context c {
        attribute atr type string description "atributo"
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    agent Agente1 {
        provider openai
        model "gpt-4o"
        profile p 
    }

    agent Agente2 {
        provider openai
        model "gpt-4o"
        profile p 
    }

    layered l {
        layer Agente1 next Agente2
        layer Agente2 next Agente1
    }
    
    from START to l
    from l to END
}`

export const R12_INV = `
{
    context c {
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    mcpServer Tavily1 {
        url "https://mcp.taddvily.com/mcp/?tavilyApiKey={key}"
        transport "streamable_http"
        apiKeyName "tavily"
        tools "tavily_search"
    }

    mcpServer Tavily2 {
        url "https://mcp.tassvily.com/mcp/?tavilyApiKey={key}"
        transport "streamable_http"
        apiKeyName "tavily"
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

export const R13_INV = `
{
    context c {
        persistence inMemorySave
    }

    profile p description "Un Prompt"

    profile p description "Otro Prompt con el mismo nombre"

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

export const R12 = `
{
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

    layered l {
        layer NombreAgente
    }
    

    from START to l
    from l to END
}`