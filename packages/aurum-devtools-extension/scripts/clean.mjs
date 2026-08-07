import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const packageDirectory = join(dirname(fileURLToPath(import.meta.url)), '..');

await rm(join(packageDirectory, 'dist'), { force: true, recursive: true });
await rm(join(packageDirectory, 'dist_test'), { force: true, recursive: true });
