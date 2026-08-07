import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['dist_test/test/**/*.test.js']
    }
});
