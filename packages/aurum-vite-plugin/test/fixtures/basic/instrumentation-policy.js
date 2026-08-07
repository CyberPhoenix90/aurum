import {
    AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED,
    DataSource,
    getAurumDevtoolsRegistry
} from '@aurum/streams';

const source = new DataSource('not registered', 'disabled instrumentation source');

export const instrumentationPolicy = Object.freeze({
    enabled: AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED,
    nodeCount: getAurumDevtoolsRegistry().getSnapshot({ includeValues: false }).nodes.length,
    sourceValue: source.value
});
