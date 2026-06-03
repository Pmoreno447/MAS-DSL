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