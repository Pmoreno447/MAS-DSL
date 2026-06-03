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