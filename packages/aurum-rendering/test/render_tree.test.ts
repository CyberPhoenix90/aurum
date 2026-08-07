import { ArrayDataSource, CancellationToken, DataSource } from '@aurum/streams';
import { assert, describe, it, vi } from 'vitest';
import {
    AurumComponentAPI,
    AurumElementModel,
    aurumElementModelIdentitiy,
    createComponentHandle,
    createLifeCycle,
    Renderable
} from '../src/rendering/aurum_element.js';
import { RendererHost, RenderTreeElementNode, RenderTreePatch, renderToHost, renderToTree } from '../src/rendering/render_tree.js';
import { ErrorBoundary } from '../src/builtin_components/error_boundary.js';

function element(name: string, props: Record<string, unknown> = {}, children: Renderable[] = []): AurumElementModel<Record<string, unknown>> {
    return {
        [aurumElementModelIdentitiy]: true,
        name,
        isIntrinsic: true,
        props,
        children,
        factory: () => {
            throw new Error('RenderTree must not invoke an intrinsic host factory');
        }
    };
}

function component<T>(
    factory: (props: T, children: Renderable[], api: AurumComponentAPI) => any,
    props: T,
    children: Renderable[] = []
): AurumElementModel<T> {
    return {
        [aurumElementModelIdentitiy]: true,
        name: factory.name,
        isIntrinsic: false,
        props,
        children,
        factory
    };
}

describe('RenderTree', () => {
    it('exposes a typed component handle only for the attached component lifetime', () => {
        interface EditorHandle {
            focus(): string;
        }
        const handle = createComponentHandle<EditorHandle>('Editor handle');
        const exposed: EditorHandle = { focus: () => 'focused' };
        const values: Array<EditorHandle | undefined> = [];
        handle.listen((value) => values.push(value));
        const tree = renderToTree(
            component(
                (props: { handle: typeof handle }, _children, api) => {
                    api.expose(props.handle, exposed);
                    return 'editor';
                },
                { handle }
            )
        );

        assert.equal(handle.value, exposed);
        assert.equal(handle.value?.focus(), 'focused');
        tree.dispose();
        assert.isUndefined(handle.value);
        assert.deepEqual(values, [exposed, undefined]);
    });

    it('does not let an older component clear a handle now owned by its replacement', () => {
        interface PublicAPI {
            id: string;
        }
        const handle = createComponentHandle<PublicAPI>();
        const first = { id: 'first' };
        const second = { id: 'second' };
        const renderComponent = (value: PublicAPI) =>
            component(
                (props: { handle: typeof handle; value: PublicAPI }, _children, api) => {
                    api.expose(props.handle, props.value);
                    return props.value.id;
                },
                { handle, value }
            );
        const active = new DataSource<Renderable>(renderComponent(first));
        const tree = renderToTree(active);
        assert.equal(handle.value, first);
        active.update(renderComponent(second));
        assert.equal(handle.value, second);
        tree.dispose();
        assert.isUndefined(handle.value);
    });

    it('materializes host-neutral elements, text, properties, and parent relationships', () => {
        const callback = (): void => undefined;
        const tree = renderToTree(element('panel', { width: 12, onClick: callback }, [element('label', {}, ['hello'])]));
        const panel = tree.roots[0] as RenderTreeElementNode;
        const label = panel.children[0] as RenderTreeElementNode;
        assert.equal(panel.tag, 'panel');
        assert.equal(panel.properties.width, 12);
        assert.equal(panel.properties.onClick, callback);
        assert.equal(label.parent, panel);
        assert.equal(label.children[0].text, 'hello');
        assert.isAbove(label.id, panel.id);
    });

    it('preserves text node identity and emits a precise text patch', () => {
        const source = new DataSource<Renderable>('first');
        const tree = renderToTree(source);
        const range = tree.roots[0];
        const text = range.children[0];
        const patches: RenderTreePatch[] = [];
        tree.onPatch.subscribe((patch) => patches.push(patch));
        source.update('second');
        assert.equal(range.children[0], text);
        assert.equal(text.text, 'second');
        assert.equal(patches.length, 1);
        assert.equal(patches[0].type, 'set-text');
    });

    it('updates array collections incrementally while preserving existing node identity', () => {
        const source = new ArrayDataSource<Renderable>(['a', 'b']);
        const tree = renderToTree(source);
        const range = tree.roots[0];
        const a = range.children[0];
        const b = range.children[1];
        const patches: RenderTreePatch[] = [];
        tree.onPatch.subscribe((patch) => patches.push(patch));

        source.unshift('x');
        assert.equal(range.children[1], a);
        assert.equal(range.children[2], b);
        assert.include(patches.map((patch) => patch.type), 'insert');

        patches.length = 0;
        source.swap(0, 2);
        assert.equal(range.children[0], b);
        assert.equal(range.children[2].text, 'x');
        assert.include(patches.map((patch) => patch.type), 'move');
    });

    it('distinguishes and moves duplicate primitive occurrences without user keys', () => {
        const source = new ArrayDataSource<Renderable>(['same', 'same']);
        const tree = renderToTree(source);
        const range = tree.roots[0];
        const first = range.children[0];
        const second = range.children[1];
        source.swap(0, 1);
        assert.equal(range.children[0], second);
        assert.equal(range.children[1], first);
    });

    it('reorders a retained collection without rebuilding nodes when patches are unobserved', () => {
        const source = new ArrayDataSource<Renderable>(['a', 'b', 'c', 'd']);
        const tree = renderToTree(source);
        const range = tree.roots[0];
        const initial = range.children.slice();

        source.merge(['d', 'c', 'b', 'a']);

        assert.deepEqual(range.children, initial.slice().reverse());
        assert.deepEqual(range.children.map((node) => node.text), ['d', 'c', 'b', 'a']);
    });

    it('disposes nested component and reactive lifetimes when a dynamic subtree is replaced', () => {
        let componentToken!: CancellationToken;
        let detached = false;
        const nestedSource = new DataSource<Renderable>('nested');
        const child = component(
            (_props: object, _children, api) => {
                componentToken = api.cancellationToken;
                api.onDetach(() => (detached = true));
                return element('box', {}, [nestedSource]);
            },
            {}
        );
        const outer = new DataSource<Renderable>(element('container', {}, [child]));
        const tree = renderToTree(outer);
        const patches: RenderTreePatch[] = [];
        tree.onPatch.subscribe((patch) => patches.push(patch));

        outer.update(undefined);
        assert.isTrue(componentToken.isCancelled);
        assert.isTrue(detached);
        patches.length = 0;
        nestedSource.update('orphaned update');
        assert.deepEqual(patches, []);
    });

    it('ignores promise resolution after disposal and reports promise rejection', async () => {
        const lifetime = new CancellationToken();
        let resolve!: (value: AurumElementModel<Record<string, unknown>>) => void;
        const pending = new Promise<AurumElementModel<Record<string, unknown>>>((done) => (resolve = done));
        const tree = renderToTree(pending, lifetime);
        lifetime.cancel();
        resolve(element('late'));
        await Promise.resolve();
        assert.equal(tree.roots[0].children.length, 0);

        const error = new Error('failed');
        let reported: Error | undefined;
        const rejected = new Promise<string>((_resolve, reject) => queueMicrotask(() => reject(error)));
        renderToTree(rejected, { onError: (value) => (reported = value) });
        await new Promise<void>((done) => queueMicrotask(done));
        assert.equal(reported, error);
    });

    it('supports host-specific reactive property resolution', () => {
        const color = new DataSource('red');
        const tree = renderToTree(element('box', { color }), {
            resolveProperty: (key, value) => (key === 'color' ? value : undefined)
        });
        const box = tree.roots[0] as RenderTreeElementNode;
        const patches: RenderTreePatch[] = [];
        tree.onPatch.subscribe((patch) => patches.push(patch));
        color.update('blue');
        assert.equal(box.properties.color, 'blue');
        assert.equal(patches[0].type, 'set-property');
    });

    it('iterates through virtual ranges transparently', () => {
        const source = new ArrayDataSource<Renderable>([element('a'), element('b')]);
        const tree = renderToTree(element('root', {}, [source]));
        assert.deepEqual(
            Array.from(tree).map(({ node }) => node.tag),
            ['root', 'a', 'b']
        );
    });

    it('mirrors incremental rendering operations into a custom host', () => {
        interface HostNode {
            kind: string;
            value?: string;
            children: HostNode[];
            properties: Record<string, unknown>;
        }
        const roots: HostNode[] = [];
        const childrenOf = (parent?: HostNode) => parent?.children ?? roots;
        const host: RendererHost<HostNode> = {
            createElement: (name, properties) => ({ kind: name, children: [], properties }),
            createText: (value) => ({ kind: 'text', value, children: [], properties: {} }),
            createRange: () => ({ kind: 'range', children: [], properties: {} }),
            insert: (parent, index, node) => childrenOf(parent).splice(index, 0, node),
            remove: (parent, index, count) => void childrenOf(parent).splice(index, count),
            move: (parent, from, to) => {
                const children = childrenOf(parent);
                children.splice(to, 0, children.splice(from, 1)[0]);
            },
            setText: (node, value) => (node.value = value),
            setProperty: (node, key, value) => (node.properties[key] = value)
        };
        const source = new DataSource<Renderable>('first');
        const rendered = renderToHost(element('screen', {}, [source]), host);
        const range = roots[0].children[0];
        assert.equal(range.children[0].value, 'first');
        source.update('second');
        assert.equal(range.children[0].value, 'second');
        rendered.dispose();
        assert.deepEqual(roots, []);
        assert.deepEqual(rendered.roots, []);

        const cancelled = new CancellationToken();
        cancelled.cancel();
        const skipped = renderToHost(element('never-created'), host, cancelled);
        assert.deepEqual(skipped.roots, []);
    });

    it('keeps component prerendering on the active host and supports error boundaries', async () => {
        const intrinsicFactoryError = new Error('an intrinsic factory was invoked');
        const hostElement: AurumElementModel<Record<string, unknown>> = {
            [aurumElementModelIdentitiy]: true,
            name: 'host-element',
            isIntrinsic: true,
            props: {},
            children: ['safe'],
            factory: () => {
                throw intrinsicFactoryError;
            }
        };
        const passthrough = component((_props: object, children, api) => {
            return api.prerender(children, createLifeCycle());
        }, {}, [hostElement]);
        const tree = renderToTree(passthrough);
        assert.equal((tree.roots[0] as RenderTreeElementNode).tag, 'host-element');

        const failure = component(() => {
            throw new Error('component failed');
        }, {});
        const boundary = component(ErrorBoundary, { errorFallback: element('fallback', {}, ['recovered']) }, [failure]);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
            const boundedTree = renderToTree(boundary);
            await Promise.resolve();
            const boundaryRange = boundedTree.roots[0];
            assert.equal(boundaryRange.children[0].tag, 'fallback');
            assert.equal(boundaryRange.children[0].children[0].text, 'recovered');
        } finally {
            consoleError.mockRestore();
        }
    });
});
