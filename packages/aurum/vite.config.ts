import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['prebuilt/esnext/test/**/*.test.{ts,tsx,js,jsx}'],
        setupFiles: ['prebuilt/esnext/test/test_utils.js'],
        browser: {
            isolate: false,
            name: 'chrome',
            enabled: true,
            headless: true
        }
    }
});
