import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const packageDirectory = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = join(packageDirectory, 'dist');

await mkdir(outputDirectory, { recursive: true });
await cp(join(packageDirectory, 'static'), outputDirectory, { recursive: true });

// TypeScript may retain files removed between builds. Only static assets are
// copied here; `clean` can be used when changing source file names.
await rm(join(outputDirectory, '.DS_Store'), { force: true });
