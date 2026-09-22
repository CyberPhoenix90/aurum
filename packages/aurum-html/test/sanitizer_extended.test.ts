import { assert, describe, it } from 'vitest';
import { sanitizeHTML, setSanitizedHTML } from '../src/index.js';

describe('sanitizer protocol and platform branches', () => {
    it('validates every srcset candidate and rejects dangerous protocols', () => {
        const safe = sanitizeHTML('<img srcset="/small.png 1x, https://example.com/large.png 2x">');
        const unsafe = sanitizeHTML(
            '<img id="script" srcset="/safe.png 1x, java\nscript:alert(1) 2x"><img id="data" srcset="data:image/png;base64,AAAA 1x">'
        );

        assert.equal(safe, '<img srcset="/small.png 1x, https://example.com/large.png 2x">');
        assert.equal(unsafe, '<img id="script"><img id="data">');
    });

    it('allows empty and fragment URLs while rejecting malformed absolute URLs', () => {
        const result = sanitizeHTML('<a id="empty" href="">empty</a><a id="hash" href="#part">hash</a><a id="bad" href="http://[">bad</a>');

        assert.equal(result, '<a id="empty" href="">empty</a><a id="hash" href="#part">hash</a><a id="bad">bad</a>');
    });

    it('supports native sanitizer implementations with the early fallback signature', () => {
        const target = document.createElement('div') as HTMLDivElement & {
            setHTML(html: string, options?: unknown): void;
        };
        let calls = 0;
        target.setHTML = (html, options) => {
            calls++;
            if (options !== undefined) throw new TypeError('legacy signature');
            target.innerHTML = html;
        };

        setSanitizedHTML(target, '<script>bad()</script><p onclick="bad()">safe</p>');

        assert.equal(calls, 2);
        assert.equal(target.innerHTML, '<p>safe</p>');
    });

    it('normalizes allow-list and reject-list entries case-insensitively', () => {
        const result = sanitizeHTML('<DIV ID="kept" TITLE="removed">content</DIV>', {
            tagWhitelist: ['DIV'],
            attributeWhitelist: ['ID', 'TITLE'],
            attributeBlacklist: ['title']
        });

        assert.equal(result, '<div id="kept">content</div>');
    });
});
