import { mkdir, writeFile } from 'node:fs/promises';

const outputDirectory = new URL('../packages/aurum/prebuilt/cjs/', import.meta.url);

await mkdir(outputDirectory, { recursive: true });
await writeFile(new URL('package.json', outputDirectory), '{\n    "type": "commonjs"\n}\n');
