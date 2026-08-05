import { assert, describe, it } from 'vitest';
import { insertSanitizedHTML, sanitizeHTML, setSanitizedHTML } from '../src/index.js';

describe('sanitizer', () => {
    it('removes unsafe elements together with their contents', () => {
        const result = sanitizeHTML('<div><script>console.log("test")</script><div>test</div></div>', {
            tagBlacklist: ['script']
        });

        assert.equal(result, '<div><div>test</div></div>');
    });

    it('removes disallowed attributes', () => {
        const result = sanitizeHTML('<div><div style="color: red">test</div></div>', {
            attributeBlacklist: ['style']
        });

        assert.equal(result, '<div><div>test</div></div>');
    });

    it('unwraps safe elements excluded by a tag allow-list', () => {
        const result = sanitizeHTML('<div><script>console.log("test")</script><b>test</b></div>', {
            tagWhitelist: ['div']
        });

        assert.equal(result, '<div>test</div>');
    });

    it('allows only exact attribute allow-list matches', () => {
        const result = sanitizeHTML('<div><div id="test" data-id="other" style="color: red">test</div></div>', {
            attributeWhitelist: ['style']
        });

        assert.equal(result, '<div><div style="color: red">test</div></div>');
    });

    it('applies mandatory safety rules when passed an empty config', () => {
        const result = sanitizeHTML(
            '<div><script>alert(1)</script><iframe srcdoc="<script>alert(2)</script>"></iframe><button ONCLICK=alert(3)>test</button></div>',
            {}
        );

        assert.equal(result, '<div><button>test</button></div>');
    });

    it('handles single-quoted and unquoted event handlers', () => {
        const result = sanitizeHTML("<button onclick='alert(1)' onfocus=alert(2)>test</button>");

        assert.equal(result, '<button>test</button>');
    });

    it('rejects encoded and control-character-obfuscated javascript URLs', () => {
        const result = sanitizeHTML('<a href="java&#x73;cript:alert(1)">one</a><a href="java\nscript:alert(2)">two</a>');

        assert.equal(result, '<a>one</a><a>two</a>');
    });

    it('allows ordinary relative and HTTPS URLs', () => {
        const result = sanitizeHTML('<a href="/docs">docs</a><img src="https://example.com/image.png">');

        assert.equal(result, '<a href="/docs">docs</a><img src="https://example.com/image.png">');
    });

    it('removes foreign SVG and MathML parsing contexts', () => {
        const result = sanitizeHTML(
            '<div>before<svg><a href="javascript:alert(1)"><text>bad</text></a></svg><math><mtext>bad</mtext></math>after</div>'
        );

        assert.equal(result, '<div>beforeafter</div>');
    });

    it('removes styles containing URLs or CSS escapes but preserves simple declarations', () => {
        const result = sanitizeHTML(
            '<div style="color: red">safe</div><div style="background: url(https://example.com/a.png)">bad</div><div style="background: u\\72l(x)">escaped</div>'
        );

        assert.equal(result, '<div style="color: red">safe</div><div>bad</div><div>escaped</div>');
    });

    it('adds opener protection to links that open a new browsing context', () => {
        const result = sanitizeHTML('<a href="https://example.com" target="_blank">external</a>');

        assert.equal(result, '<a href="https://example.com" target="_blank" rel="noopener noreferrer">external</a>');
    });

    it('safely inserts sanitized nodes without requiring callers to reparse the string', () => {
        const target = document.createElement('div');

        setSanitizedHTML(target, '<img src=x onerror=alert(1)><p>safe</p>');

        assert.isFalse(target.querySelector('img').hasAttribute('onerror'));
        assert.equal(target.textContent, 'safe');
    });

    it('applies the same mandatory protections in the detached-DOM fallback', () => {
        const target = document.createElement('div') as HTMLDivElement & { setHTML?: undefined };
        target.setHTML = undefined;

        setSanitizedHTML(
            target,
            '<script>alert(1)</script><svg><a href="javascript:alert(2)">bad</a></svg><img src="java&#x73;cript:alert(3)" onerror=alert(4)><p style="background:u\\72l(x)">safe</p>'
        );

        assert.equal(target.innerHTML, '<img><p>safe</p>');
    });

    it('inserts sanitized HTML without rebuilding existing nodes', () => {
        const target = document.createElement('div');
        const existing = document.createElement('p');
        existing.textContent = 'existing';
        target.append(existing);

        insertSanitizedHTML(target, '<img src=x onerror=alert(1)><p>appended</p>', 'append');
        insertSanitizedHTML(target, '<button onclick=alert(2)>prepended</button>', 'prepend');

        assert.strictEqual(target.querySelectorAll('p')[0], existing);
        assert.equal(target.textContent, 'prependedexistingappended');
        assert.isNull(target.querySelector('[onerror], [onclick]'));
    });
});
