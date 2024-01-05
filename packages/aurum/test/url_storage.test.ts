import { expect } from 'chai';
import { UrlStorage } from '../src/utilities/url_storage.js';

describe('UrlStorage', () => {
    beforeEach(() => {
        history.replaceState(null, '', '/');
    });

    it('should be able to set and get a value', () => {
        const testKey = 'test-key';
        const testValue = 'test-value';

        const urlStorage = new UrlStorage();
        urlStorage.setItem(testKey, testValue);

        expect(urlStorage.getItem(testKey)).to.equal(testValue);
    });

    it('should be able to remove a value', () => {
        const testKey = 'test-key';
        const testValue = 'test-value';

        const urlStorage = new UrlStorage();
        urlStorage.setItem(testKey, testValue);

        expect(urlStorage.getItem(testKey)).to.equal(testValue);

        urlStorage.removeItem(testKey);

        expect(urlStorage.getItem(testKey)).to.be.undefined;
    });

    it('should be able to set and get values from the URL', () => {
        const testKey = 'test-key';
        const testValue = 'test-value';

        const urlStorage = new UrlStorage();
        urlStorage.setItem(testKey, testValue);

        expect(window.location.search).to.equal(`?${testKey}=${testValue}`);

        const newUrlStorage = new UrlStorage();
        expect(newUrlStorage.getItem(testKey)).to.equal(testValue);
    });

    it('should be able to remove a value from the URL', () => {
        const testKey = 'test-key';
        const testValue = 'test-value';

        const urlStorage = new UrlStorage();
        urlStorage.setItem(testKey, testValue);

        expect(window.location.search).to.equal(`?${testKey}=${testValue}`);

        urlStorage.removeItem(testKey);

        expect(window.location.search).to.equal(``);
    });
});
