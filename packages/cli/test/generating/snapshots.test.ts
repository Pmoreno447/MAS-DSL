import { describe, test, expect } from 'vitest';
import { createMultiAgentDslServices } from 'multi-agent-dsl-language';
import { NodeFileSystem } from 'langium/node';
import { extractAstNode } from '../../src/util.js';
import { generate } from '../../src/generator.js';
import type { LLMMultiAgentSystem } from 'multi-agent-dsl-language';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, '../fixture');

function readFilesRecursive(dir: string, base: string = dir): Record<string, string> {
    const result: Record<string, string> = {};
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const rel = path.relative(base, full);
        if (entry.isDirectory()) {
            Object.assign(result, readFilesRecursive(full, base));
        } else {
            result[rel] = fs.readFileSync(full, 'utf-8');
        }
    }
    return result;
}

const fixtures = fs.readdirSync(FIXTURES)
    .filter(d => fs.statSync(path.join(FIXTURES, d)).isDirectory())
    .sort();

const services = createMultiAgentDslServices(NodeFileSystem).MultiAgentDsl;

describe('Generator snapshots', () => {
    for (const fixture of fixtures) {
        test(fixture, async () => {
            const modelPath = path.join(FIXTURES, fixture, 'model.mad');
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `mad-${fixture}-`));
            try {
                const model = await extractAstNode<LLMMultiAgentSystem>(modelPath, services);
                generate(model, modelPath, tempDir);
                const files = readFilesRecursive(tempDir);
                for (const [relPath, content] of Object.entries(files).sort()) {
                    expect(content).toMatchSnapshot(relPath);
                }
            } finally {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
    }
});
