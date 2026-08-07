import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
    define: {
        'process.env.NODE_ENV': '"production"',
        __AURUM_DEVTOOLS_MODE__: '"production"',
        __AURUM_DEVTOOLS_CAPTURE_STACKS__: 'false',
        __AURUM_DEVTOOLS_HISTORY_LIMIT__: '0',
        __AURUM_DEVTOOLS_INSTRUMENTATION__: 'false'
    },
    resolve: {
        conditions: ['production', 'browser', 'module', 'import']
    },
    test: {
        fileParallelism: false,
        benchmark: {
            include: ['dist_bench/bench/**/*.bench.js'],
            exclude: ['dist_bench/bench/devtools_overhead.bench.js'],
            reporters: ['verbose']
        },
        browser: {
            isolate: false,
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }]
        }
    }
});
