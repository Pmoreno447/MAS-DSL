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
