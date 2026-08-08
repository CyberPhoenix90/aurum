import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
    test: {
        include: ['dist_test/test/**/*.test.js'],
        isolate: true,
        browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }]
        }
    }
});
