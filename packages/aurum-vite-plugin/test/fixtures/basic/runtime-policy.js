import { configureAurumDevtools, getAurumDevtoolsRegistry } from '@aurum/streams';

const registry = getAurumDevtoolsRegistry();
configureAurumDevtools({ mode: 'debug', captureStacks: true, historyLimit: 100 });

export const runtimePolicy = Object.freeze({
    mode: registry.mode,
    captureStacks: registry.config.captureStacks,
    historyLimit: registry.config.historyLimit
});
