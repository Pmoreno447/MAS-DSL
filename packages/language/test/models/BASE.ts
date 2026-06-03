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