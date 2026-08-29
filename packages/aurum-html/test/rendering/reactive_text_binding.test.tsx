import { afterEach, assert, describe, it } from 'vitest';
import { ArrayDataSource, Aurum, CancellationToken, DataSource, Renderable } from '../../src/index.js';

describe('reactive text bindings', () => {
    let attachToken: CancellationToken | undefined;

    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    function host(): HTMLElement {
        return document.getElementById('target')!.firstChild as HTMLElement;
    }

    function nodeKinds(): string[] {
        return Array.from(host().childNodes).map((node) =>
            node instanceof Comment ? 'comment' : node instanceof Text ? `text:${node.data}` : node.nodeName.toLowerCase()
        );
    }

    it('renders a text-valued data source as a bare text node without comment markers', () => {
        const label = new DataSource<Renderable>('first');
        attachToken = Aurum.attach(<div>{label}</div>, document.getElementById('target')!);

        assert.deepEqual(nodeKinds(), ['text:first']);
        const textNode = host().firstChild;

        label.update('second');
        assert.deepEqual(nodeKinds(), ['text:second']);
        assert.strictEqual(host().firstChild, textNode);

        label.update(42);
        assert.deepEqual(nodeKinds(), ['text:42']);
    });

    it('keeps sibling ordering with an empty text placeholder while the source renders nothing', () => {
        const middle = new DataSource<Renderable>(null);
        attachToken = Aurum.attach(
            <div>
                <span />
                {middle}
                <b />
            </div>,
            document.getElementById('target')!
        );

        assert.deepEqual(nodeKinds(), ['span', 'text:', 'b']);
        assert.equal(host().textContent, '');

        middle.update('between');
        assert.deepEqual(nodeKinds(), ['span', 'text:between', 'b']);

        middle.update(false);
        assert.deepEqual(nodeKinds(), ['span', 'text:', 'b']);
    });

    it('promotes to a comment-bounded range when a non-primitive renderable appears and keeps ordering', () => {
        const content = new DataSource<Renderable>('text');
        attachToken = Aurum.attach(
            <div>
                <span />
                {content}
                <b />
            </div>,
            document.getElementById('target')!
        );
        assert.deepEqual(nodeKinds(), ['span', 'text:text', 'b']);

        content.update(<i>element</i>);
        assert.deepEqual(nodeKinds(), ['span', 'i', 'comment', 'b']);

        content.update('text again');
        assert.deepEqual(nodeKinds(), ['span', 'text:text again', 'comment', 'b']);

        content.update([<u>one</u>, <u>two</u>]);
        assert.deepEqual(nodeKinds(), ['span', 'u', 'u', 'comment', 'b']);
        assert.equal(host().textContent, 'onetwo');
    });

    it('removes the text node when the binding is disposed', () => {
        const label = new DataSource<Renderable>('gone');
        attachToken = Aurum.attach(
            <div>
                <span />
                {label}
            </div>,
            document.getElementById('target')!
        );
        assert.deepEqual(nodeKinds(), ['span', 'text:gone']);

        attachToken.cancel();
        attachToken = undefined;
        assert.isNull(document.getElementById('target')!.firstChild);
    });

    it('moves text bindings as collection entries and keeps them reactive', () => {
        const values = [new DataSource<Renderable>('a'), new DataSource<Renderable>('b'), new DataSource<Renderable>('c')];
        const items = new ArrayDataSource<Renderable>(values);
        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target')!);
        // The collection itself is a comment-bounded range; its text entries carry no markers of their own.
        const entries = (): string[] => nodeKinds().filter((kind) => kind !== 'comment');
        assert.equal(nodeKinds().filter((kind) => kind === 'comment').length, 1);
        assert.deepEqual(entries(), ['text:a', 'text:b', 'text:c']);

        items.swap(0, 2);
        assert.deepEqual(entries(), ['text:c', 'text:b', 'text:a']);

        values[1].update('B');
        assert.deepEqual(entries(), ['text:c', 'text:B', 'text:a']);

        items.removeAt(1);
        assert.deepEqual(entries(), ['text:c', 'text:a']);
        values[1].update('detached');
        assert.deepEqual(entries(), ['text:c', 'text:a']);
        assert.equal(nodeKinds().filter((kind) => kind === 'comment').length, 1);
    });

    it('promotes a promise placeholder into an element once it resolves', async () => {
        let resolve: (value: Renderable) => void;
        const pending = new Promise<Renderable>((done) => (resolve = done));
        attachToken = Aurum.attach(
            <div>
                <span />
                {pending}
                <b />
            </div>,
            document.getElementById('target')!
        );
        assert.deepEqual(nodeKinds(), ['span', 'text:', 'b']);

        resolve!(<i>loaded</i>);
        await new Promise<void>((done) => setTimeout(done, 0));
        assert.deepEqual(nodeKinds(), ['span', 'i', 'comment', 'b']);
    });
});
