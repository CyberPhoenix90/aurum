import { afterEach, assert, describe, it } from 'vitest';
import {
    Aurum,
    CancellationToken,
    DataSource,
    aurumToHTML,
    createEventHandlers,
    processHTMLNode
} from '../../src/index.js';

describe('public DOM rendering utilities', () => {
    const tokens: CancellationToken[] = [];

    afterEach(() => {
        for (const token of tokens.splice(0)) token.cancel();
        document.getElementById('target')!.replaceChildren();
    });

    it('processes inner HTML, reactive attributes, and custom event maps', () => {
        const token = new CancellationToken();
        tokens.push(token);
        const title = new DataSource('first');
        const node = document.createElement('section');
        let doubleClicks = 0;
        processHTMLNode(
            node,
            {
                dangerouslySetInnerHTML: { __html: '<b>content</b>' },
                title,
                'data-extra': 'yes',
                onDouble: () => doubleClicks++
            } as never,
            token,
            ['data-extra'],
            { doubleclick: 'onDouble' },
            undefined,
            true
        );
        document.getElementById('target')!.append(node);

        assert.equal(node.innerHTML, '<b>content</b>');
        assert.equal(node.title, 'first');
        assert.equal(node.dataset.extra, 'yes');
        node.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        assert.equal(doubleClicks, 1);

        title.update('second');
        assert.equal(node.title, 'second');
        token.cancel();
        title.update('ignored');
        assert.equal(node.title, 'second');
    });

    it('creates direct event handlers including the double-click alias', () => {
        const node = document.createElement('button');
        const events: string[] = [];
        createEventHandlers(
            node,
            { doubleclick: 'onDouble', focus: 'onFocus', blur: 'onMissing' },
            { onDouble: () => events.push('double'), onFocus: () => events.push('focus') }
        );

        node.dispatchEvent(new MouseEvent('dblclick'));
        node.dispatchEvent(new FocusEvent('focus'));
        assert.deepEqual(events, ['double', 'focus']);
    });

    it('rejects unsupported attribute value types', () => {
        const token = new CancellationToken();
        tokens.push(token);

        assert.throws(
            () => processHTMLNode(document.createElement('div'), { title: { invalid: true } } as never, token),
            /Attributes only support types/
        );
    });

    it('exposes explicit attach and dispose lifecycle controls for inline HTML', () => {
        const lifecycle: string[] = [];
        const rendered = aurumToHTML(
            <div onAttach={() => lifecycle.push('attach')} onDetach={() => lifecycle.push('detach')}>
                content
            </div>
        );
        document.getElementById('target')!.append(rendered.content);

        rendered.fireOnAttach();
        assert.deepEqual(lifecycle, ['attach']);
        rendered.dispose();
        assert.deepEqual(lifecycle, ['attach', 'detach']);
        assert.isFalse(rendered.content.isConnected);
    });
});
