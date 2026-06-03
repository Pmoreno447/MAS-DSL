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
        tokenTrigger 4500
    }

    layered l {
        layer NombreAgente
    }
    
    from START to l
    from l to END
}`