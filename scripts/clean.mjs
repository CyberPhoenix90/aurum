import { rm } from 'node:fs/promises';

const paths = [
    'artifacts',
    'packages/aurum-streams/prebuilt',
    'packages/aurum-streams/dist_test',
    'packages/aurum-rendering/prebuilt',
    'packages/aurum-rendering/dist_test',
    'packages/aurum-html/prebuilt',
    'packages/aurum-html/dist_test',
    'packages/aurum-remote/prebuilt',
    'packages/aurum-remote/dist_test',
    'packages/aurum-canvas/prebuilt',
    'packages/aurum-canvas/dist_test',
    'packages/aurum-canvas/dist_bench',
    'packages/aurum-components/prebuilt',
    'packages/aurum-components/dist_test',
    'packages/aurum-server/prebuilt',
    'packages/aurum-server/dist_test',
    'packages/aurum-server/dist_bench',
    'packages/aurum-vite-plugin/prebuilt',
    'packages/aurum-vite-plugin/dist_test',
    'packages/aurum-devtools-extension/dist',
    'packages/aurum-devtools-extension/dist_test'
];

await Promise.all(paths.map((path) => rm(path, { recursive: true, force: true })));
