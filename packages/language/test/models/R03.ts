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