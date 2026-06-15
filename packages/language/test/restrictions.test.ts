import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem } from "langium";
import { parseHelper } from "langium/test";
import { createMultiAgentDslServices, LLMMultiAgentSystem } from "multi-agent-dsl-language";
import {MODELO_BASE} from "./models/BASE.js";
import {R01_INV} from "./models/R01.js";
import {R02, R02_INV} from "./models/R02.js";
import { R03_INV } from "./models/R03.js";
import { R04, R04_INV } from "./models/R04.js";
import { R05_INV } from "./models/R05.js";
import { R06_BOOL, R06_INT, R06_STR, R06_INV_BOOL, R06_INV_INT, R06_INV_STR } from "./models/R06.js";
import { R07_INV } from "./models/R07.js";
import { R08_INF, R08_SUP, R08_INV_INF, R08_INV_SUP } from "./models/R08.js";
import { R09, R09_INV } from "./models/R09.js";
import { R10, R10_INV_maxMesages, R10_INV_maxRetries, R10_INV_maxToken, R10_INV_timeOut, R10_INV_tokenTrigger } from "./models/R10.js";
import { R11_INV } from "./models/R11.js";
import { R12, R12_INV } from "./models/R12.js";
import { R13_INV } from "./models/R13.js";
import { R14_INV } from "./models/R14.js";
import { R15_INV } from "./models/R15.js";

let parse: ReturnType<typeof parseHelper<LLMMultiAgentSystem>>;

beforeAll(async () => {
    const services = createMultiAgentDslServices(EmptyFileSystem);
    const doParse = parseHelper<LLMMultiAgentSystem>(services.MultiAgentDsl);
    parse = (input: string) => doParse(input, { validation: true });
});

// Helper: parsea un modelo y devuelve la lista de códigos de error (R01, R02...).
async function validar(modelo: string): Promise<string[]> {
    const doc = await parse(modelo);
    return (doc.diagnostics ?? []).map(d => String(d.code ?? ""));
}

/**
 * Genera el describe + los dos tests (inválido / válido) de una restricción.
 * @param codigo           código de la restricción, ej. "R01"
 * @param nombre           descripción legible
 * @param modeloInvalido   modelo que DEBE disparar el error
 * @param modeloValido     modelo que NO debe dispararlo (por defecto MODELO_BASE)
 * 
 */
function testRestriccion(
    codigo: string,
    nombre: string,
    modeloInvalido: string,
    modeloValido: string = MODELO_BASE,
) {
    describe(`${codigo} - ${nombre}`, () => {
        test("CASO INVALIDO", async () => {
            expect(await validar(modeloInvalido)).toContain(codigo);
        });
        test("CASO VALIDO", async () => {
            expect(await validar(modeloValido)).not.toContain(codigo);
        });
    });
}

testRestriccion("R01", "Estructuras de comunicación unidas", R01_INV);

testRestriccion("R02", "Servidores MCP sin repetir", R02_INV, R02);

testRestriccion("R03", "Punto de inicio único", R03_INV)

testRestriccion("R04", "Sin arcos duplicados", R04_INV, R04)

testRestriccion("R05", "Las restricciones únicas no pueden tener restricción", R05_INV)

testRestriccion("R06", "Compatibilidad de tipos en la consición de transición (INT)", R06_INV_INT, R06_INT)

testRestriccion("R06", "Compatibilidad de tipos en la consición de transición (BOOL)", R06_INV_BOOL, R06_BOOL)

testRestriccion("R06", "Compatibilidad de tipos en la consición de transición (STRING)", R06_INV_STR, R06_STR)

testRestriccion("R07", "Un solo else por transición", R07_INV, R06_STR) // Sé que estoy usando el modelo de R06 para validar la R07, no es un error

testRestriccion("R08", "Temperatura de los agentes (Limite Inferior)", R08_INV_INF, R08_INF )

testRestriccion("R08", "Temperatura de los agentes (Limite Inferior)", R08_INV_SUP, R08_SUP )

testRestriccion("R09", "Un solo nodo summarizer", R09_INV, R09)

testRestriccion("R10", "Valor positivo de maxMessages", R10_INV_maxMesages, R10)

testRestriccion("R10", "Valor positivo de tokenTrigger", R10_INV_tokenTrigger, R10)

testRestriccion("R10", "Valor positivo de maxToken", R10_INV_maxToken, R10)

testRestriccion("R10", "Valor positivo de timeOut", R10_INV_timeOut, R10)

testRestriccion("R10", "Valor positivo de maxRetries", R10_INV_maxRetries, R10)

testRestriccion("R11", "Layered sin ciclos", R11_INV)

testRestriccion("R12", "MCP con distintas API KEY", R12_INV, R12)

testRestriccion("R13", "Nombres únicos en el sistema", R13_INV)

testRestriccion("R14", "Sumarizer no puede tener perfil", R14_INV)

testRestriccion("R15", "Un nodo no puede pertenece a varias estructuras de comunicación", R15_INV)

