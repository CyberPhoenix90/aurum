import { afterEach, describe, expect, it } from 'vitest';
import {
    act,
    createContext,
    createPortal,
    createRef,
    createRoot,
    forwardRef,
    memo,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction
} from '../src/index.js';

const roots: Array<{ unmount(): void }> = [];
const containers: HTMLElement[] = [];

function testRoot(): { container: HTMLElement; root: ReturnType<typeof createRoot> } {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    containers.push(container);
    return { container, root };
}

afterEach(() => {
    while (roots.length) roots.pop()!.unmount();
    while (containers.length) containers.pop()!.remove();
});

describe('@aurum/compat reconciliation', () => {
    it('preserves keyed DOM nodes and component state while reordering a list', () => {
        let reorder!: Dispatch<SetStateAction<string[]>>;

        function Item({ id }: { id: string }): Aurum.JSX.Element {
            const [clicks, setClicks] = useState(0);
            return (
                <li data-id={id}>
                    <button onClick={() => setClicks((value) => value + 1)}>{id}:{clicks}</button>
                </li>
            );
        }

        function List(): Aurum.JSX.Element {
            const [order, setOrder] = useState(['a', 'b', 'c']);
            reorder = setOrder;
            return <ul>{order.map((id) => <Item key={id} id={id} />)}</ul>;
        }

        const { container, root } = testRoot();
        act(() => root.render(<List />));
        const before = new Map(Array.from(container.querySelectorAll('li')).map((node) => [node.dataset.id!, node]));

        (before.get('b')!.querySelector('button') as HTMLButtonElement).click();
        expect(before.get('b')!.textContent).toBe('b:1');

        act(() => reorder(['c', 'b', 'a']));
        const after = Array.from(container.querySelectorAll('li'));
        expect(after.map((node) => node.dataset.id)).toEqual(['c', 'b', 'a']);
        expect(after[0]).toBe(before.get('c'));
        expect(after[1]).toBe(before.get('b'));
        expect(after[2]).toBe(before.get('a'));
        expect(after[1].textContent).toBe('b:1');
    });

    it('preserves focus and selection while normalizing a controlled text input', () => {
        function Controlled(): Aurum.JSX.Element {
            const [value, setValue] = useState('abcd');
            return (
                <input
                    value={value}
                    onChange={(event) => setValue(event.currentTarget.value.toUpperCase())}
                />
            );
        }

        const { container, root } = testRoot();
        act(() => root.render(<Controlled />));
        const input = container.querySelector('input')!;
        input.focus();
        input.value = 'abxcd';
        input.setSelectionRange(3, 3);
        input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'x' }));

        expect(container.querySelector('input')).toBe(input);
        expect(input.value).toBe('ABXCD');
        expect(document.activeElement).toBe(input);
        expect(input.selectionStart).toBe(3);
        expect(input.selectionEnd).toBe(3);
    });

    it('runs changed effect cleanup and unmount cleanup exactly once', () => {
        const calls: string[] = [];

        function Subject({ value }: { value: number }): Aurum.JSX.Element {
            useLayoutEffect(() => {
                calls.push(`layout ${value}`);
                return () => calls.push(`layout cleanup ${value}`);
            }, [value]);
            useEffect(() => {
                calls.push(`effect ${value}`);
                return () => calls.push(`effect cleanup ${value}`);
            }, [value]);
            return <span>{value}</span>;
        }

        const { root } = testRoot();
        act(() => root.render(<Subject value={1} />));
        expect(calls).toEqual(['layout 1', 'effect 1']);

        act(() => root.render(<Subject value={2} />));
        expect(calls).toEqual([
            'layout 1',
            'effect 1',
            'layout cleanup 1',
            'layout 2',
            'effect cleanup 1',
            'effect 2'
        ]);

        root.unmount();
        expect(calls).toEqual([
            'layout 1',
            'effect 1',
            'layout cleanup 1',
            'layout 2',
            'effect cleanup 1',
            'effect 2',
            'layout cleanup 2',
            'effect cleanup 2'
        ]);
    });

    it('propagates context changes through a memoized intermediary', () => {
        const Theme = createContext('default');
        let updateTheme!: Dispatch<SetStateAction<string>>;

        const Leaf = memo(function Leaf(): Aurum.JSX.Element {
            return <span>{useContext(Theme)}</span>;
        });
        const retainedLeaf = <Leaf />;
        const Bridge = memo(function Bridge(): Aurum.JSX.Element {
            return <section>{retainedLeaf}</section>;
        });

        function App(): Aurum.JSX.Element {
            const [theme, setTheme] = useState('light');
            updateTheme = setTheme;
            return <Theme.Provider value={theme}><Bridge /></Theme.Provider>;
        }

        const { container, root } = testRoot();
        act(() => root.render(<App />));
        const span = container.querySelector('span')!;
        expect(span.textContent).toBe('light');

        act(() => updateTheme('dark'));
        expect(container.querySelector('span')).toBe(span);
        expect(span.textContent).toBe('dark');
    });

    it('supports object refs, callback refs, forwardRef, and imperative handles', () => {
        interface Handle {
            focus(): void;
            readonly node: HTMLInputElement | null;
        }

        const divRef = createRef<HTMLDivElement>();
        const handleRef = createRef<Handle>();
        const callbackValues: Array<HTMLSpanElement | null> = [];
        const callbackRef = (node: HTMLSpanElement | null): void => {
            callbackValues.push(node);
        };

        const Field = forwardRef<Handle, { label: string }>(function Field({ label }, ref): Aurum.JSX.Element {
            const inputRef = useRef<HTMLInputElement>(null);
            useImperativeHandle(ref, () => ({
                focus: () => inputRef.current?.focus(),
                get node() { return inputRef.current; }
            }), []);
            return <input ref={inputRef} defaultValue={label} />;
        });

        const { container, root } = testRoot();
        act(() => root.render(
            <>
                <div ref={divRef}>object</div>
                <span ref={callbackRef}>callback</span>
                <Field ref={handleRef} label="field" />
            </>
        ));

        expect(divRef.current).toBe(container.querySelector('div'));
        expect(callbackValues).toEqual([container.querySelector('span')]);
        expect(handleRef.current?.node).toBe(container.querySelector('input'));
        handleRef.current?.focus();
        expect(document.activeElement).toBe(handleRef.current?.node);

        root.unmount();
        expect(divRef.current).toBeNull();
        expect(callbackValues[callbackValues.length - 1]).toBeNull();
        expect(handleRef.current).toBeNull();
    });

    it('runs a callback ref cleanup return on unmount', () => {
        let cleanupCount = 0;
        const { root } = testRoot();
        act(() => root.render(
            <span ref={(node) => node ? () => { cleanupCount++; } : undefined}>cleanup</span>
        ));
        root.unmount();
        expect(cleanupCount).toBe(1);
    });

    it('reconciles portal children in place across parent renders', () => {
        const target = document.createElement('div');
        document.body.appendChild(target);
        containers.push(target);
        let setLabel!: Dispatch<SetStateAction<string>>;

        function PortalChild({ label }: { label: string }): Aurum.JSX.Element {
            const [count, setCount] = useState(0);
            return <button onClick={() => setCount((value) => value + 1)}>{label}:{count}</button>;
        }

        function App(): Aurum.JSX.Element {
            const [label, updateLabel] = useState('first');
            setLabel = updateLabel;
            return createPortal(<PortalChild label={label} />, target);
        }

        const { root } = testRoot();
        act(() => root.render(<App />));
        const button = target.querySelector('button')!;
        button.click();
        expect(button.textContent).toBe('first:1');

        act(() => setLabel('second'));
        expect(target.querySelector('button')).toBe(button);
        expect(button.textContent).toBe('second:1');

        root.unmount();
        expect(target.querySelector('button')).toBeNull();
    });
});
