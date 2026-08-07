import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    define: {
        __AURUM_DEVTOOLS_INSTRUMENTATION__: 'false',
        __AURUM_DEVTOOLS_MODE__: JSON.stringify('production'),
        __AURUM_DEVTOOLS_CAPTURE_STACKS__: 'false',
        __AURUM_DEVTOOLS_HISTORY_LIMIT__: '0'
    },
    build: {
        emptyOutDir: false,
        minify: false,
        sourcemap: true,
        lib: {
            entry: resolve(import.meta.dirname, 'src/panel.ts'),
            formats: ['es'],
            fileName: () => 'panel.js'
        }
    }
});
