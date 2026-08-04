import { rm } from 'node:fs/promises';

const paths = [
    'artifacts',
    'packages/aurum/prebuilt',
    'packages/aurum/dist_test',
    'packages/aurum-canvas/prebuilt',
    'packages/aurum-components/prebuilt',
    'packages/aurum-server/prebuilt'
];

await Promise.all(paths.map((path) => rm(path, { recursive: true, force: true })));
