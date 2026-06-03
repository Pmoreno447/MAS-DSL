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
    }

    summarizer ResumenInicioDos {
        provider openai
        model "gpt-4o"
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
    }

    layered l {
        layer NombreAgente
    }
    
    from START to l
    from l to END
}`