import { defineConfig } from 'vitest/config';

export default defineConfig({
    esbuild: {
        jsxFactory: 'Aurum.factory',
        jsxFragment: 'Aurum.fragment'
    }
});
