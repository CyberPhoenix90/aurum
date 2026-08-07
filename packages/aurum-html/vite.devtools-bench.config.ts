import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
    define: {
        'process.env.NODE_ENV': '"production"',
        __AURUM_DEVTOOLS_INSTRUMENTATION__: 'true'
    },
    resolve: {
        conditions: ['production', 'browser', 'module', 'import']
    },
    test: {
        benchmark: {
            include: ['dist_bench/bench/devtools_overhead.bench.js'],
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
