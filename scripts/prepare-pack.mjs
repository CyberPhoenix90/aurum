import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
