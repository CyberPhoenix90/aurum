import { assert, describe, it } from 'vitest';
import { sanitizeHTML } from '../src/aurumjs.js';

describe('sanitizer', () => {
    it('should remove disallowed tags', () => {
        const htmlString = '<div><script>console.log("test")</script><div>test</div></div>';
        const result = sanitizeHTML(htmlString, {
            tagBlacklist: ['script']
        });

        assert.equal(result, '<div>console.log("test")<div>test</div></div>');
    });

    it('should remove disallowed attributes', () => {
        const htmlString = '<div><div style="color: red">test</div></div>';
        const result = sanitizeHTML(htmlString, {
            attributeBlacklist: ['style']
        });

        assert.equal(result, '<div><div>test</div></div>');
    });

    it('should allow whitelisted tags', () => {
        const htmlString = '<div><script>console.log("test")</script><b>test</b></div>';
        const result = sanitizeHTML(htmlString, {
            tagWhitelist: ['div']
        });

        assert.equal(result, '<div>console.log("test")test</div>');
    });

    it('should allow whitelisted attributes', () => {
        const htmlString = '<div><div id="test" style="color: red">test</div></div>';
        const result = sanitizeHTML(htmlString, {
            attributeWhitelist: ['style']
        });

        assert.equal(result, '<div><div style="color: red">test</div></div>');
    });
});
