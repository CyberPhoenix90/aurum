import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    Children,
    Fragment,
    PORTAL,
    StrictMode,
    act,
    cloneElement,
    createContext,
    createElement,
    createPortal,
    createRef,
    createRoot,
    flushCompatEffects,
    flushSync,
    isValidElement,
    jsx,
    jsxDEV,
    jsxs,
    useCallback,
    useDeferredValue,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
    type Dispatch,
    type ReactNode,
    type SetStateAction
} from '../src/index.js';

const roots: Array<{ unmount(): void }> = [];
const containers: HTMLElement[] = [];

function testRoot(): { container: HTMLElement; root: ReturnType<typeof createRoot> } {
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const root = createRoot(container);
    roots.push(root);
    return { container, root };
}

afterEach(() => {
    while (roots.length) roots.pop()!.unmount();
    while (containers.length) containers.pop()!.remove();
    vi.restoreAllMocks();
});

describe('@aurumjs/compat vnode API', () => {
    it('extracts keys and refs across automatic JSX entry points', () => {
        const ref = createRef<HTMLDivElement>();
        const element = jsx('div', { key: 'from-props', ref, title: 'subject', children: 'body' }, 'explicit');
        const development = jsxDEV('span', { key: 2, children: 'dev' }, undefined, true, { fileName: 'ignored' }, {});
        const staticChildren = jsxs(Fragment, { children: ['a', 'b'] });

        expect(element.key).toBe('explicit');
        expect(element.ref).toBe(ref);
        expect(element.props).toEqual({ title: 'subject', children: 'body' });
        expect(development.key).toBe(2);
        expect(development.props).toEqual({ children: 'dev' });
        expect(staticChildren.type).toBe(Fragment);
        expect(isValidElement(element)).toBe(true);
        expect(isValidElement({ type: 'div', props: {} })).toBe(false);
    });

    it('supports classic element creation and clone overrides while retaining key and ref defaults', () => {
        const originalRef = createRef<HTMLParagraphElement>();
        const original = createElement('p', { key: 7, ref: originalRef, title: 'before' }, 'first');
        const retained = cloneElement(original, { title: 'after' });
        const overridden = cloneElement(original, { key: 0, ref: null }, 'one', 'two');
        const empty = createElement('hr', null);

        expect(original.props.children).toBe('first');
        expect(retained.key).toBe(7);
        expect(retained.ref).toBe(originalRef);
        expect(retained.props).toEqual({ title: 'after', children: 'first' });
        expect(overridden.key).toBe(0);
        expect(overridden.ref).toBeNull();
        expect(overridden.props.children).toEqual(['one', 'two']);
        expect(empty.props).toEqual({});
        expect(() => cloneElement({} as never)).toThrow(TypeError);
    });

    it('flattens iterable children and implements count, map, forEach, and only', () => {
        const node = <strong>node</strong>;
        const input: ReactNode = [null, false, 'a', [1, new Set<ReactNode>(['b', true])], node];
        const visited: Array<[ReactNode, number]> = [];

        expect(Children.toArray(input)).toEqual(['a', 1, 'b', node]);
        expect(Children.count(input)).toBe(4);
        expect(Children.map(input, (child, index) => `${index}:${isValidElement(child) ? 'node' : String(child)}`)).toEqual([
            '0:a',
            '1:1',
            '2:b',
            '3:node'
        ]);
        Children.forEach(input, (child, index) => visited.push([child, index]));
        expect(visited).toEqual([
            ['a', 0],
            [1, 1],
            ['b', 2],
            [node, 3]
        ]);
        expect(Children.only(node)).toBe(node);
        expect(() => Children.only(null)).toThrow(/exactly one child/);
        expect(() => Children.only(['one', 'two'])).toThrow(/exactly one child/);
        expect(StrictMode({ children: input })).toBe(input);
    });

    it('creates keyed portals and moves their output when the target changes', () => {
        const firstTarget = document.createElement('div');
        const secondTarget = document.createElement('div');
        document.body.append(firstTarget, secondTarget);
        containers.push(firstTarget, secondTarget);
        const portal = createPortal(<button>portable</button>, firstTarget, 'portal-key');
        expect(portal.type).toBe(PORTAL);
        expect(portal.key).toBe('portal-key');
        expect(portal.props.container).toBe(firstTarget);

        const { root } = testRoot();
        act(() => root.render(portal));
        expect(firstTarget.textContent).toBe('portable');
        act(() => root.render(createPortal(<button>moved</button>, secondTarget, 'portal-key')));
        expect(firstTarget.textContent).toBe('');
        expect(secondTarget.textContent).toBe('moved');
    });
});

describe('@aurumjs/compat public hooks', () => {
    it('keeps memo, callback, and ref identities stable and batches state with flushSync', () => {
        let setCount!: Dispatch<SetStateAction<number>>;
        let initializerCalls = 0;
        let renders = 0;
        const observations: Array<{ memo: object; callback: () => number; ref: object; count: number }> = [];

        function Subject(): Aurum.JSX.Element {
            const [count, updateCount] = useState(() => {
                initializerCalls++;
                return 0;
            });
            setCount = updateCount;
            const memoized = useMemo(() => ({ count }), [count]);
            const callback = useCallback(() => count, [count]);
            const ref = useRef({ stable: true });
            renders++;
            observations.push({ memo: memoized, callback, ref, count });
            return <span>{count}</span>;
        }

        const { container, root } = testRoot();
        act(() => root.render(<Subject />));
        act(() => root.render(<Subject />));
        expect(initializerCalls).toBe(1);
        expect(renders).toBe(2);
        expect(observations[1].memo).toBe(observations[0].memo);
        expect(observations[1].callback).toBe(observations[0].callback);
        expect(observations[1].ref).toBe(observations[0].ref);

        const result = flushSync(() => {
            setCount(1);
            setCount((value) => value);
            return 'flushed';
        });
        expect(result).toBe('flushed');
        expect(renders).toBe(3);
        expect(container.textContent).toBe('1');
        expect(observations[2].callback()).toBe(1);
        expect(observations[2].memo).not.toBe(observations[1].memo);
    });

    it('defers values by a microtask and returns stable, distinct ids', async () => {
        let setValue!: Dispatch<SetStateAction<string>>;
        const seenIds: string[][] = [];

        function Subject(): Aurum.JSX.Element {
            const [value, updateValue] = useState('first');
            setValue = updateValue;
            const deferred = useDeferredValue(value, 'initial');
            const firstId = useId();
            const secondId = useId();
            seenIds.push([firstId, secondId]);
            return <span>{`${deferred}|${firstId}|${secondId}`}</span>;
        }

        const { container, root } = testRoot();
        act(() => root.render(<Subject />));
        expect(container.textContent?.startsWith('initial|')).toBe(true);
        await act(async () => {
            await Promise.resolve();
        });
        expect(container.textContent?.startsWith('first|')).toBe(true);

        act(() => setValue('second'));
        expect(container.textContent?.startsWith('first|')).toBe(true);
        await act(async () => {
            await Promise.resolve();
        });
        expect(container.textContent?.startsWith('second|')).toBe(true);
        expect(seenIds[0][0]).toBe(seenIds[seenIds.length - 1][0]);
        expect(seenIds[0][0]).not.toBe(seenIds[0][1]);
        expect(seenIds[0][0]).toMatch(/^:aurum-r\d+-h\d+:$/);
    });

    it('subscribes to external stores, ignores unchanged snapshots, resubscribes, and cleans up', () => {
        let snapshot = 'one';
        let notifyFirst: (() => void) | undefined;
        let notifySecond: (() => void) | undefined;
        const firstCleanup = vi.fn();
        const secondCleanup = vi.fn();
        const firstSubscribe = vi.fn((notify: () => void) => {
            notifyFirst = notify;
            return firstCleanup;
        });
        const secondSubscribe = vi.fn((notify: () => void) => {
            notifySecond = notify;
            return secondCleanup;
        });
        const getSnapshot = (): string => snapshot;
        let renders = 0;

        function Subject({ subscribe }: { subscribe: (notify: () => void) => () => void }): Aurum.JSX.Element {
            renders++;
            return <span>{useSyncExternalStore(subscribe, getSnapshot, () => 'server')}</span>;
        }

        const { container, root } = testRoot();
        act(() => root.render(<Subject subscribe={firstSubscribe} />));
        expect(firstSubscribe).toHaveBeenCalledTimes(1);
        expect(container.textContent).toBe('one');

        act(() => {
            snapshot = 'two';
            notifyFirst!();
        });
        expect(container.textContent).toBe('two');
        const rendersAfterChange = renders;
        act(() => notifyFirst!());
        expect(renders).toBe(rendersAfterChange);

        act(() => root.render(<Subject subscribe={secondSubscribe} />));
        expect(firstCleanup).toHaveBeenCalledTimes(1);
        expect(secondSubscribe).toHaveBeenCalledTimes(1);
        act(() => {
            snapshot = 'three';
            notifySecond!();
        });
        expect(container.textContent).toBe('three');
        root.unmount();
        expect(secondCleanup).toHaveBeenCalledTimes(1);
    });

    it('supports context Consumers, nested providers, and default values', () => {
        const Theme = createContext('default');
        const { container, root } = testRoot();
        act(() =>
            root.render(
                <>
                    <Theme.Consumer>{(value) => <span data-kind="default">{value}</span>}</Theme.Consumer>
                    <Theme.Provider value="outer">
                        <Theme.Consumer>{(value) => <span data-kind="outer">{value}</span>}</Theme.Consumer>
                        <Theme.Provider value="inner">
                            <Theme.Consumer>{(value) => <span data-kind="inner">{value}</span>}</Theme.Consumer>
                        </Theme.Provider>
                    </Theme.Provider>
                </>
            )
        );

        expect(container.querySelector('[data-kind="default"]')?.textContent).toBe('default');
        expect(container.querySelector('[data-kind="outer"]')?.textContent).toBe('outer');
        expect(container.querySelector('[data-kind="inner"]')?.textContent).toBe('inner');
    });

    it('flushes passive effects explicitly and through async act', async () => {
        const calls: string[] = [];
        let setValue!: Dispatch<SetStateAction<number>>;

        function Subject(): Aurum.JSX.Element {
            const [value, updateValue] = useState(0);
            setValue = updateValue;
            useEffect(() => {
                calls.push(`effect ${value}`);
                return () => calls.push(`cleanup ${value}`);
            }, [value]);
            return <span>{value}</span>;
        }

        const { root } = testRoot();
        root.render(<Subject />);
        expect(calls).toEqual([]);
        flushCompatEffects();
        expect(calls).toEqual(['effect 0']);

        await act(async () => {
            setValue(1);
            await Promise.resolve();
        });
        expect(calls).toEqual(['effect 0', 'cleanup 0', 'effect 1']);
    });

    it('rejects hooks outside a component and guards root lifecycle misuse', () => {
        const Context = createContext('value');
        expect(() => useState(0)).toThrow(/only be called while rendering/);
        expect(() => useMemo(() => 1, [])).toThrow(/only be called while rendering/);
        expect(() => Context.Consumer({ children: (value) => value })).toThrow(/only be called while rendering/);
        expect(() => createRoot({} as HTMLElement)).toThrow(TypeError);

        const container = document.createElement('div');
        const root = createRoot(container);
        root.unmount();
        expect(() => root.render(<span />)).toThrow(/unmounted/);
        expect(() => root.unmount()).not.toThrow();
    });
});
