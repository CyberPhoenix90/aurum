import { afterEach, describe, expect, it } from 'vitest';
import { act, createRoot, useState, type CSSProperties } from '../src/index.js';

describe('@aurum/compat host semantics', () => {
    let root: ReturnType<typeof createRoot> | undefined;
    let container: HTMLElement | undefined;

    afterEach(() => {
        root?.unmount();
        container?.remove();
        root = undefined;
        container = undefined;
    });

    function mount(node: Aurum.ReactNode): HTMLElement {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        act(() => root!.render(node));
        return container;
    }

    it('maps className, diffs dynamic style, serializes aria false, and omits booleans', () => {
        let toggle!: () => void;
        function Example(): Aurum.JSX.Element {
            const [active, setActive] = useState(true);
            toggle = () => setActive((value) => !value);
            const style: CSSProperties = active ? { width: 12, opacity: 0.5, '--accent': 3 } : { height: 8 };
            return <div className={active ? 'on' : 'off'} style={style} aria-pressed={active}>{false}{active && 'yes'}</div>;
        }

        const host = mount(<Example />).querySelector('div')!;
        expect(host.className).toBe('on');
        expect(host.style.width).toBe('12px');
        expect(host.style.opacity).toBe('0.5');
        expect(host.style.getPropertyValue('--accent')).toBe('3');
        expect(host.getAttribute('aria-pressed')).toBe('true');
        expect(host.textContent).toBe('yes');

        act(toggle);
        expect(host.className).toBe('off');
        expect(host.style.width).toBe('');
        expect(host.style.height).toBe('8px');
        expect(host.getAttribute('aria-pressed')).toBe('false');
        expect(host.textContent).toBe('');
    });

    it('supports defaultValue, defaultChecked, controlled select, autofocus, and dangerous SVG markup', () => {
        const host = mount(
            <section>
                <input data-kind="default" defaultValue="seed" defaultChecked type="checkbox" />
                <input data-kind="focus" autoFocus />
                <select value="b">
                    <option value="a">A</option>
                    <option value="b">B</option>
                </select>
                <svg viewBox="0 0 10 10">
                    <g dangerouslySetInnerHTML={{ __html: '<path data-glyph="yes" d="M0 0h1v1z"></path>' }} />
                </svg>
            </section>
        );
        const defaultInput = host.querySelector<HTMLInputElement>('input[data-kind="default"]')!;
        const focusInput = host.querySelector<HTMLInputElement>('input[data-kind="focus"]')!;
        const select = host.querySelector('select')!;
        expect(defaultInput.value).toBe('seed');
        expect(defaultInput.checked).toBe(true);
        expect(document.activeElement).toBe(focusInput);
        expect(select.value).toBe('b');
        expect(host.querySelector('svg g path')?.getAttribute('data-glyph')).toBe('yes');
    });

    it('restores a controlled field when onChange does not publish an update', () => {
        let changes = 0;
        const host = mount(<input type="checkbox" checked={false} onChange={() => changes++} />);
        const input = host.querySelector('input')!;
        input.click();
        expect(changes).toBe(1);
        expect(input.checked).toBe(false);
    });

    it('uses per-keystroke input events for range and color onChange', () => {
        const calls: string[] = [];
        const host = mount(
            <>
                <input type="range" defaultValue={2} onChange={() => calls.push('range')} />
                <input type="color" defaultValue="#000000" onChange={() => calls.push('color')} />
            </>
        );
        const inputs = host.querySelectorAll('input');
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        expect(calls).toEqual(['range', 'color']);
    });

    it('retains false values for enumerated DOM properties', () => {
        const node = mount(<div draggable={false} spellCheck={false} contentEditable={false} />).querySelector('div')!;
        expect(node.draggable).toBe(false);
        expect(node.spellcheck).toBe(false);
        expect(node.contentEditable).toBe('false');
    });

    it('creates SVG nodes in their namespace, normalizes SVG attributes, and dispatches media events', () => {
        let ended = 0;
        const host = mount(
            <>
                <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 10 10">
                    <path strokeWidth={2} d="M0 0h1" />
                </svg>
                <audio onEnded={() => ended++} />
            </>
        );
        const svg = host.querySelector('svg')!;
        const path = host.querySelector('path')!;
        expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
        expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
        expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
        expect(path.getAttribute('stroke-width')).toBe('2');
        host.querySelector('audio')!.dispatchEvent(new Event('ended'));
        expect(ended).toBe(1);
    });

    it('uses select defaultValue as the form-reset default', () => {
        const host = mount(
            <form>
                <select defaultValue="b">
                    <option value="a">A</option>
                    <option value="b">B</option>
                </select>
            </form>
        );
        const form = host.querySelector('form')!;
        const select = host.querySelector('select')!;
        expect(select.value).toBe('b');
        expect(select.options[1].defaultSelected).toBe(true);
        select.value = 'a';
        form.reset();
        expect(select.value).toBe('b');
    });
});
