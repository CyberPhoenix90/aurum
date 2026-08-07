import { afterEach, assert, describe, it } from 'vitest';
import { Aurum, CancellationToken, DataSource, DuplexDataSource, createGenericIntrinsicFactory } from '../../src/index.js';

describe('HTML intrinsic compatibility', () => {
    let attachment: CancellationToken | undefined;

    afterEach(() => {
        attachment?.cancel();
        attachment = undefined;
        document.getElementById('target')!.replaceChildren();
    });

    it('supports section, datalist, and standard elements through the generic fallback', () => {
        attachment = Aurum.attach(
            <main data-page="editor">
                <section aria-label="Tools">
                    <input list="tools" />
                    <datalist id="tools"><option value="paint" /></datalist>
                </section>
            </main>,
            document.getElementById('target')!
        );
        const main = document.querySelector('main')!;
        assert.equal(main.dataset.page, 'editor');
        assert.equal(main.querySelector('section')?.getAttribute('aria-label'), 'Tools');
        assert.instanceOf(main.querySelector('datalist'), HTMLDataListElement);
    });

    it('exports a generic intrinsic factory for valid custom elements and attributes', () => {
        const Generic = createGenericIntrinsicFactory('game-kiln-panel');
        attachment = Aurum.attach(
            <Generic id="panel" data-kind="tools" hidden={true} title="Tools" />,
            document.getElementById('target')!
        );
        const panel = document.querySelector('game-kiln-panel') as HTMLElement;
        assert.equal(panel.id, 'panel');
        assert.equal(panel.dataset.kind, 'tools');
        assert.isTrue(panel.hidden);
        assert.equal(panel.title, 'Tools');
    });

    it('normalizes valid HTML attribute aliases without supporting className', () => {
        attachment = Aurum.attach(
            <div>
                <label htmlFor="name">Name</label>
                <input id="name" readOnly={true} autoComplete="off" maxLength={12} spellCheck={false} />
                <img crossOrigin="anonymous" srcSet="small.png 1x" />
                <table><tbody><tr><td colSpan={2} rowSpan={3}>cell</td></tr></tbody></table>
            </div>,
            document.getElementById('target')!
        );
        assert.equal(document.querySelector('label')!.getAttribute('for'), 'name');
        const input = document.querySelector('input')!;
        assert.isTrue(input.readOnly);
        assert.equal(input.autocomplete, 'off');
        assert.equal(input.maxLength, 12);
        assert.isFalse(input.spellcheck);
        assert.equal(document.querySelector('img')!.crossOrigin, 'anonymous');
        assert.equal(document.querySelector('img')!.srcset, 'small.png 1x');
        assert.equal(document.querySelector('td')!.colSpan, 2);
        assert.equal(document.querySelector('td')!.rowSpan, 3);
    });

    it('does not bind className through the generic intrinsic fallback', () => {
        attachment = Aurum.attach(
            Aurum.factory('div', { id: 'no-class-name', className: 'should-not-bind' }),
            document.getElementById('target')!
        );

        assert.equal(document.getElementById('no-class-name')!.getAttribute('class'), null);
    });

    it('supports double-click and wheel aliases', () => {
        const events: string[] = [];
        attachment = Aurum.attach(
            <div onDoubleClick={() => events.push('double')} onWheel={() => events.push('wheel')} />,
            document.getElementById('target')!
        );
        const element = document.querySelector('#target > div')!;
        element.dispatchEvent(new MouseEvent('dblclick'));
        element.dispatchEvent(new WheelEvent('wheel'));
        assert.deepEqual(events, ['double', 'wheel']);
    });

    it('binds numeric input values as properties and preserves numeric duplex writes', () => {
        const value = new DuplexDataSource<number>(3, false);
        const checked = new DataSource(false);
        attachment = Aurum.attach(
            <div>
                <input id="number" type="number" value={value} />
                <input id="check" type="checkbox" checked={checked} />
            </div>,
            document.getElementById('target')!
        );
        const numberInput = document.getElementById('number') as HTMLInputElement;
        const checkbox = document.getElementById('check') as HTMLInputElement;
        assert.equal(numberInput.value, '3');
        value.publish(7);
        assert.equal(numberInput.value, '7');
        numberInput.value = '11';
        numberInput.dispatchEvent(new InputEvent('input'));
        assert.equal(value.value, 11);
        checked.update(true);
        assert.isTrue(checkbox.checked);
        assert.equal(checkbox.getAttribute('checked'), null);
    });

    it('updates selected and value state through DOM properties', () => {
        const selected = new DataSource(false);
        const progress = new DataSource(2);
        attachment = Aurum.attach(
            <div>
                <select><option>first</option><option selected={selected}>second</option></select>
                <progress max={10} value={progress} />
            </div>,
            document.getElementById('target')!
        );
        const option = document.querySelectorAll('option')[1];
        const progressElement = document.querySelector('progress')!;
        selected.update(true);
        progress.update(6);
        assert.isTrue(option.selected);
        assert.equal(progressElement.value, 6);
    });

    it('updates reactive attributes directly while suppressing duplicate writes', () => {
        const title = new DataSource('initial');
        attachment = Aurum.attach(<span title={title} />, document.getElementById('target')!);
        const span = document.querySelector('span')!;
        const setAttribute = span.setAttribute.bind(span);
        let titleWrites = 0;
        span.setAttribute = ((name: string, value: string) => {
            if (name === 'title') titleWrites++;
            setAttribute(name, value);
        }) as typeof span.setAttribute;

        title.update('initial');
        title.update('updated');
        title.update('updated');

        assert.equal(span.title, 'updated');
        assert.equal(titleWrites, 1);
    });
});
