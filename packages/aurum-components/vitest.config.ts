import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['dist_test/**/*.test.{js,jsx}']
    }
});
