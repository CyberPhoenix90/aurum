import { expect, describe, beforeEach, it } from 'vitest';
import { UrlStorage } from '../src/aurumjs.js';

describe('UrlStorage', () => {
    beforeEach(() => {
        history.replaceState(null, '', '/');
    });

    it('should be able to set and get a value', () => {
        const testKey = 'test-key';
        const testValue = 'test-value';

        const urlStorage = new UrlStorage();
        urlStorage.setItem(testKey, testValue);

        expect(urlStorage.getItem(testKey)).toBe(testValue);
    });

    it('should be able to remove a value', () => {
        const testKey = 'test-key';
        const testValue = 'test-value';

        const urlStorage = new UrlStorage();
        urlStorage.setItem(testKey, testValue);

        expect(urlStorage.getItem(testKey)).toBe(testValue);

        urlStorage.removeItem(testKey);

        expect(urlStorage.getItem(testKey)).toBeUndefined();
    });

    it('should be able to set and get values from the URL', () => {
        const testKey = 'test-key';
        const testValue = 'test-value';

        const urlStorage = new UrlStorage();
        urlStorage.setItem(testKey, testValue);

        expect(window.location.search).toBe(`?${testKey}=${testValue}`);

        const newUrlStorage = new UrlStorage();
        expect(newUrlStorage.getItem(testKey)).toBe(testValue);
    });

    it('should be able to remove a value from the URL', () => {
        const testKey = 'test-key';
        const testValue = 'test-value';

        const urlStorage = new UrlStorage();
        urlStorage.setItem(testKey, testValue);

        expect(window.location.search).toBe(`?${testKey}=${testValue}`);

        urlStorage.removeItem(testKey);

        expect(window.location.search).toBe(``);
    });
});
