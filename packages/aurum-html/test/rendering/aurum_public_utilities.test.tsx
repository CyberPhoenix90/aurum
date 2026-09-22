import { afterEach, assert, describe, it } from 'vitest';
import { ArrayDataSource, Aurum, CancellationToken, DataSource } from '../../src/index.js';

describe('Aurum public utilities', () => {
    const tokens: CancellationToken[] = [];

    afterEach(() => {
        for (const token of tokens.splice(0)) token.cancel();
        document.getElementById('target')!.replaceChildren();
    });

    it('reactively sanitizes DataSource HTML and stops after cancellation', () => {
        const html = new DataSource('<p id="first">first</p>');
        const target = document.getElementById('target')!;
        const token = Aurum.stringToInnerHTML(html, target);
        tokens.push(token);

        assert.equal(target.textContent, 'first');
        const first = target.firstChild;
        html.update('<p id="first">first</p>');
        assert.strictEqual(target.firstChild, first);
        html.update('<script>bad()</script><p onclick="bad()">second</p>');
        assert.equal(target.innerHTML, '<p>second</p>');

        token.cancel();
        assert.equal(target.childNodes.length, 0);
        html.update('<p>ignored</p>');
        assert.equal(target.childNodes.length, 0);
    });

    it('updates ArrayDataSource HTML incrementally and rebuilds for structural changes', () => {
        const html = new ArrayDataSource(['<span id="middle">middle</span>']);
        const target = document.getElementById('target')!;
        const token = Aurum.stringToInnerHTML(html, target);
        tokens.push(token);
        const middle = document.getElementById('middle');

        html.push('<span id="last">last</span>');
        html.unshift('<span id="first">first</span>');
        assert.equal(target.textContent, 'firstmiddlelast');
        assert.strictEqual(document.getElementById('middle'), middle);

        html.set(1, '<em id="replacement">replacement</em>');
        assert.equal(target.textContent, 'firstreplacementlast');
        assert.isNotNull(document.getElementById('replacement'));
        html.clear();
        assert.equal(target.childNodes.length, 0);
    });

    it('rehydrates by replacing the supplied server node and preserves siblings', () => {
        const target = document.getElementById('target')!;
        target.innerHTML = '<p id="server">server</p><i id="sibling">sibling</i>';
        const serverNode = document.getElementById('server') as HTMLElement;
        const token = Aurum.rehydrate(<button id="client">client</button>, serverNode);
        tokens.push(token);

        assert.isNull(document.getElementById('server'));
        assert.equal(document.getElementById('client')!.textContent, 'client');
        assert.equal(document.getElementById('sibling')!.textContent, 'sibling');
    });

    it('rejects undefined roots and invalid decorators', () => {
        const target = document.getElementById('target')!;

        assert.throws(() => Aurum.attach(undefined as never, target), /Cannot attach undefined renderable/);
        assert.throws(() => Aurum.factory('div', { decorate: 'invalid' }), /Decorate must be a function/);
    });

    it('reuses the generic intrinsic factory for repeated custom tags', () => {
        const first = Aurum.factory('audit-panel', { id: 'first' });
        const second = Aurum.factory('audit-panel', { id: 'second' });

        assert.strictEqual(first.factory, second.factory);
        const token = Aurum.attach([first, second], document.getElementById('target')!);
        tokens.push(token);
        assert.equal(document.querySelectorAll('audit-panel').length, 2);
    });
});
