import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
    test: {
        include: ['dist_test/**/*.test.{js,jsx}'],
        setupFiles: ['dist_test/test/test_utils.js'],
        browser: {
            isolate: false,
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }]
        }
    }
});
