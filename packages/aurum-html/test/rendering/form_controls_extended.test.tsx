import { afterEach, assert, describe, it } from 'vitest';
import { Aurum, CancellationToken, DuplexDataSource, batchRender } from '../../src/index.js';

describe('form control bindings', () => {
    let attachment: CancellationToken | undefined;

    afterEach(() => {
        attachment?.cancel();
        attachment = undefined;
        document.getElementById('target')!.replaceChildren();
    });

    it('supports static and default values for textareas and selects', () => {
        attachment = Aurum.attach(
            <div>
                <textarea id="default-text" defaultValue="draft" />
                <textarea id="static-text" value="published" />
                <select id="default-select" defaultValue="b">
                    <option value="a">A</option>
                    <option value="b">B</option>
                </select>
                <select id="static-select" value="b">
                    <option value="a">A</option>
                    <option value="b">B</option>
                </select>
                <input id="static-checked" type="checkbox" checked={true} />
            </div>,
            document.getElementById('target')!
        );

        assert.equal((document.getElementById('default-text') as HTMLTextAreaElement).defaultValue, 'draft');
        assert.equal((document.getElementById('static-text') as HTMLTextAreaElement).value, 'published');
        assert.equal((document.getElementById('default-select') as HTMLSelectElement).value, 'b');
        assert.equal((document.getElementById('static-select') as HTMLSelectElement).value, 'b');
        assert.isTrue((document.getElementById('static-checked') as HTMLInputElement).checked);
    });

    it('keeps textarea values duplex-bound and coalesces batched publications', () => {
        const value = new DuplexDataSource('initial', false);
        const upstream: string[] = [];
        value.listenUpstream((next) => upstream.push(next));
        attachment = Aurum.attach(<textarea value={value} />, document.getElementById('target')!);
        const textArea = document.querySelector('textarea')!;

        assert.equal(textArea.value, 'initial');
        batchRender(() => {
            value.publish('intermediate');
            value.publish('final');
            assert.equal(textArea.value, 'initial');
        });
        assert.equal(textArea.value, 'final');

        textArea.value = 'typed';
        textArea.dispatchEvent(new InputEvent('input', { bubbles: true }));
        assert.deepEqual(upstream, ['typed']);
    });

    it('keeps select value and index bindings synchronized in both directions', () => {
        const value = new DuplexDataSource<number>(2, false);
        const selectedIndex = new DuplexDataSource(1, false);
        const stringValue = new DuplexDataSource('b', false);
        const valueWrites: number[] = [];
        const indexWrites: number[] = [];
        const stringWrites: string[] = [];
        value.listenUpstream((next) => valueWrites.push(next));
        selectedIndex.listenUpstream((next) => indexWrites.push(next));
        stringValue.listenUpstream((next) => stringWrites.push(next));

        attachment = Aurum.attach(
            <div>
                <select id="by-value" value={value}>
                    <option value="1">one</option>
                    <option value="2">two</option>
                    <option value="3">three</option>
                </select>
                <select id="by-index" selectedIndex={selectedIndex}>
                    <option>zero</option>
                    <option>one</option>
                    <option>two</option>
                </select>
                <select id="by-string" value={stringValue}>
                    <option value="a">A</option>
                    <option value="b">B</option>
                </select>
            </div>,
            document.getElementById('target')!
        );
        const byValue = document.getElementById('by-value') as HTMLSelectElement;
        const byIndex = document.getElementById('by-index') as HTMLSelectElement;
        const byString = document.getElementById('by-string') as HTMLSelectElement;

        assert.equal(byValue.value, '2');
        assert.equal(byIndex.selectedIndex, 1);
        batchRender(() => {
            value.publish(3);
            selectedIndex.publish(2);
            assert.equal(byValue.value, '2');
            assert.equal(byIndex.selectedIndex, 1);
        });
        assert.equal(byValue.value, '3');
        assert.equal(byIndex.selectedIndex, 2);

        byValue.value = '1';
        byValue.dispatchEvent(new Event('change', { bubbles: true }));
        byIndex.selectedIndex = 0;
        byIndex.dispatchEvent(new Event('change', { bubbles: true }));
        byString.value = 'a';
        byString.dispatchEvent(new Event('change', { bubbles: true }));
        assert.deepEqual(valueWrites, [1]);
        assert.deepEqual(indexWrites, [0]);
        assert.deepEqual(stringWrites, ['a']);
    });

    it('reapplies reactive select state after options are replaced', async () => {
        const value = new DuplexDataSource('b', false);
        const selectedIndex = new DuplexDataSource(1, false);
        attachment = Aurum.attach(
            <div>
                <select id="by-value" value={value}>
                    <option value="a">A</option>
                    <option value="b">B</option>
                </select>
                <select id="by-index" selectedIndex={selectedIndex}>
                    <option>A</option>
                    <option>B</option>
                </select>
            </div>,
            document.getElementById('target')!
        );
        const byValue = document.getElementById('by-value') as HTMLSelectElement;
        const byIndex = document.getElementById('by-index') as HTMLSelectElement;

        byValue.replaceChildren(new Option('A', 'a'), new Option('B', 'b'));
        byIndex.replaceChildren(new Option('A'), new Option('B'));
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        assert.equal(byValue.value, 'b');
        assert.equal(byIndex.selectedIndex, 1);
    });

    it('writes checkbox state upstream for duplex checked bindings', () => {
        const checked = new DuplexDataSource(false, false);
        const upstream: boolean[] = [];
        checked.listenUpstream((next) => upstream.push(next));
        attachment = Aurum.attach(<input type="checkbox" checked={checked} />, document.getElementById('target')!);
        const input = document.querySelector('input')!;

        batchRender(() => checked.publish(true));
        assert.isTrue(input.checked);
        input.checked = false;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        assert.deepEqual(upstream, [false]);
    });
});
