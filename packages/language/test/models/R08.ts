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