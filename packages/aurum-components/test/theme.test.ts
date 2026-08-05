import { afterEach, assert, describe, it } from 'vitest';
import { currentTheme, darkTheme, lightTheme, theme } from '../src/theme/theme.js';

describe('reactive theme projections', () => {
    afterEach(() => {
        currentTheme.update(darkTheme);
    });

    it('follows active theme replacement and subsequent property updates', () => {
        const originalPrimary = lightTheme.primary.value;
        try {
            currentTheme.update(lightTheme);
            assert.equal(theme.primary.value, originalPrimary);

            lightTheme.primary.update('#123456');
            assert.equal(theme.primary.value, '#123456');
        } finally {
            lightTheme.primary.update(originalPrimary);
        }
    });

    it('stops following the previous theme after replacement', () => {
        const originalDarkPrimary = darkTheme.primary.value;
        currentTheme.update(lightTheme);
        const activeValue = theme.primary.value;

        try {
            darkTheme.primary.update('#654321');
            assert.equal(theme.primary.value, activeValue);
        } finally {
            darkTheme.primary.update(originalDarkPrimary);
        }
    });
});
