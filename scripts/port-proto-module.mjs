/**
 * Converts a prototype global script into an ES module without touching its logic.
 *
 * The prototype's data.js / icons.js declare everything as top-level globals so plain
 * <script> tags can share them. Vite needs explicit exports, so this appends an export
 * block listing every top-level declaration. The bodies are copied byte-for-byte, which
 * is what keeps the ported UI behaviourally identical to the frozen prototype.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [, , inputPath, outputPath, ...extraExports] = process.argv;

if (!inputPath || !outputPath) {
    console.error('usage: node port-proto-module.mjs <input> <output> [extraExport...]');
    process.exit(1);
}

const source = readFileSync(resolve(inputPath), 'utf8');

// Top-level declarations only: `function foo(`, `const foo =`, `let foo =`, `var foo =`
// anchored at column 0 so nested declarations are never picked up.
const declaration = /^(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;

const names = new Set();
for (const match of source.matchAll(declaration)) {
    names.add(match[1]);
}

for (const name of extraExports) {
    names.add(name);
}

const sorted = [...names].sort();

const banner = `/* AUTO-GENERATED from ${inputPath.replace(/\\/g, '/')} by scripts/port-proto-module.mjs.
   Logic is copied verbatim from the frozen prototype — edit the prototype and re-run the
   script rather than hand-editing this file. */\n\n`;

const exportBlock = `\n\nexport {\n${sorted.map((n) => `    ${n},`).join('\n')}\n};\n`;

mkdirSync(dirname(resolve(outputPath)), { recursive: true });
writeFileSync(resolve(outputPath), banner + source + exportBlock, 'utf8');

console.log(`${outputPath}: ${sorted.length} exports`);
console.log(sorted.join(', '));
