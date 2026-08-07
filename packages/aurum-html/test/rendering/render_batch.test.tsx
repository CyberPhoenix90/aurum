import { afterEach, assert, describe, it } from 'vitest';
import { ArrayDataSource, Aurum, CancellationToken, DataSource, Renderable, batchRender } from '../../src/index.js';

describe('batchRender', () => {
    let attachment: CancellationToken | undefined;

    afterEach(() => {
        attachment?.cancel();
        attachment = undefined;
        document.getElementById('target')!.replaceChildren();
    });

    it('keeps streams synchronous while committing only the final DOM value', () => {
        const value = new DataSource('initial');
        const observed: string[] = [];
        value.listen((next) => observed.push(next));
        attachment = Aurum.attach(<span>{value}</span>, document.getElementById('target')!);

        batchRender(() => {
            value.update('first');
            value.update('second');
            value.update('final');
            assert.equal(value.value, 'final');
            assert.equal(document.querySelector('span')!.textContent, 'initial');
        });

        assert.deepEqual(observed, ['first', 'second', 'final']);
        assert.equal(document.querySelector('span')!.textContent, 'final');
    });

    it('does not construct or attach intermediary component states', () => {
        const rendered: number[] = [];
        const attached: number[] = [];
        function Panel(props: { revision: number }): Renderable {
            rendered.push(props.revision);
            return <section onAttach={() => attached.push(props.revision)}>{props.revision}</section>;
        }
        const active = new DataSource<Renderable>(<Panel revision={0} />);
        attachment = Aurum.attach(<main>{active}</main>, document.getElementById('target')!);

        Aurum.batchRender(() => {
            active.update(<Panel revision={1} />);
            active.update(<Panel revision={2} />);
            active.update(<Panel revision={3} />);
        });

        assert.deepEqual(rendered, [0, 3]);
        assert.deepEqual(attached, [0, 3]);
        assert.equal(document.querySelector('section')!.textContent, '3');
    });

    it('coalesces attributes, classes, styles, and form-control properties', () => {
        const title = new DataSource('initial');
        const className = new DataSource('first');
        const style = new DataSource('color: red');
        const value = new DataSource('one');
        attachment = Aurum.attach(
            <input title={title} class={className} style={style} value={value} />,
            document.getElementById('target')!
        );
        const input = document.querySelector('input')!;

        batchRender(() => {
            title.update('intermediate');
            title.update('final');
            className.update('second');
            className.update('final-class');
            style.update('color: blue');
            style.update('color: green');
            value.update('two');
            value.update('three');
            assert.equal(input.title, 'initial');
            assert.equal(input.value, 'one');
        });

        assert.equal(input.title, 'final');
        assert.equal(input.className, 'final-class');
        assert.include(input.getAttribute('style'), 'green');
        assert.equal(input.value, 'three');
    });

    it('reconciles a collection once against its final identity snapshot', () => {
        const items = new ArrayDataSource<Renderable>(['a', 'b']);
        attachment = Aurum.attach(<div>{items}</div>, document.getElementById('target')!);
        const container = document.querySelector('#target > div')!;
        const retainedB = Array.from(container.childNodes).find((node) => node.nodeValue === 'b');

        batchRender(() => {
            items.swap(0, 1);
            items.push('c');
            items.removeAt(1);
            assert.equal(container.textContent, 'ab');
        });

        assert.equal(container.textContent, 'bc');
        const finalB = Array.from(container.childNodes).find((node) => node.nodeValue === 'b');
        assert.equal(finalB, retainedB);
    });

    it('supports nesting and flushes final rendering when the callback throws', () => {
        const value = new DataSource('initial');
        attachment = Aurum.attach(<span>{value}</span>, document.getElementById('target')!);

        assert.throws(() => {
            batchRender(() => {
                value.update('outer');
                batchRender(() => value.update('final'));
                assert.equal(document.querySelector('span')!.textContent, 'initial');
                throw new Error('expected failure');
            });
        }, /expected failure/);
        assert.equal(document.querySelector('span')!.textContent, 'final');
    });
});
