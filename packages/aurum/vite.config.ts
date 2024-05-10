import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['dist_test/**/*.test.{js,jsx}'],
        setupFiles: ['dist_test/test/test_utils.js'],
        browser: {
            isolate: false,
            name: 'chrome',
            enabled: true,
            headless: true
        }
    }
});
