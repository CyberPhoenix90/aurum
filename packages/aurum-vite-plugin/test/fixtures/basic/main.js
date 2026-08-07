import config, { captureStacks, mode } from 'virtual:aurum-devtools/config';
import { DataSource, getAurumDevtoolsRegistry } from '@aurum/streams';

const compileTimeMode = typeof __AURUM_DEVTOOLS_MODE__ === 'undefined' ? 'missing' : __AURUM_DEVTOOLS_MODE__;
const compileTimeStacks =
    typeof __AURUM_DEVTOOLS_CAPTURE_STACKS__ === 'undefined' ? 'missing' : __AURUM_DEVTOOLS_CAPTURE_STACKS__;
const source = new DataSource('fixture value', 'vite fixture source');
source.update('updated fixture value');
const runtime = getAurumDevtoolsRegistry();

document.querySelector('#app').textContent = JSON.stringify({
    config,
    captureStacks,
    mode,
    compileTimeMode,
    compileTimeStacks,
    runtimeMode: runtime.mode,
    runtimeStacks: runtime.config.captureStacks,
    runtimeNode: runtime.inspect(source)
});
