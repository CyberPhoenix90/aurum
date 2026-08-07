import { afterEach, describe, expect, it } from 'vitest';
import {
    configureAurumDevtools,
    DataSource,
    getAurumDevtoolsRegistry,
    resolveAurumDevtoolsNodeId
} from '@aurum/streams';
import {
    AurumComponentAPI,
    AurumElementModel,
    aurumElementModelIdentitiy,
    createLifeCycle,
    Renderable
} from '../src/rendering/aurum_element.js';
import { renderToTree } from '../src/rendering/render_tree.js';

function component(
    factory: (props: Record<string, never>, children: Renderable[], api: AurumComponentAPI) => Renderable
): AurumElementModel<Record<string, never>> {
    return {
        [aurumElementModelIdentitiy]: true,
        name: factory.name,
        isIntrinsic: false,
        props: {},
        children: [],
        factory
    };
}

describe('renderer developer tooling', () => {
    afterEach(() => {
        configureAurumDevtools({ mode: 'production', captureStacks: false, historyLimit: 0 });
        getAurumDevtoolsRegistry().clearHistory();
    });

    it('connects sources, render bindings, and nested component instances in debug mode', () => {
        configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 50 });
        const message = new DataSource<Renderable>('hello', 'message');

        function Child(): Renderable {
            return message;
        }

        function Parent(): Renderable {
            return component(Child);
        }

        const tree = renderToTree(component(Parent));
        const snapshot = getAurumDevtoolsRegistry().getSnapshot();
        const parent = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'Parent');
        const child = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'Child');
        const binding = snapshot.nodes.find((node) => node.kind === 'render-binding' && node.name === 'virtual render range');
        const sourceId = resolveAurumDevtoolsNodeId(message);

        expect(parent).toBeDefined();
        expect(child).toBeDefined();
        expect(binding).toBeDefined();
        expect(sourceId).toBeDefined();
        expect(snapshot.edges).toContainEqual(expect.objectContaining({ source: parent?.id, target: child?.id, kind: 'component-child' }));
        expect(snapshot.edges).toContainEqual(expect.objectContaining({ source: child?.id, target: binding?.id, kind: 'component-output' }));
        expect(snapshot.edges).toContainEqual(expect.objectContaining({ source: sourceId, target: binding?.id, kind: 'render' }));

        message.update('updated');
        expect(getAurumDevtoolsRegistry().inspect(sourceId)?.version).toBe(1);

        const rendererNodeIds = snapshot.nodes
            .filter((node) => node.kind === 'component' || node.kind === 'render-binding')
            .map((node) => node.id);
        tree.dispose();
        const afterDispose = getAurumDevtoolsRegistry().getSnapshot();
        expect(afterDispose.nodes.filter((node) => rendererNodeIds.includes(node.id))).toEqual([]);
    });

    it('does not connect an independent reentrant render to the component that started it', () => {
        configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 20 });
        let independentTree: ReturnType<typeof renderToTree> | undefined;

        function IndependentRoot(): Renderable {
            return 'independent';
        }

        function ReentrantRoot(): Renderable {
            independentTree = renderToTree(component(IndependentRoot));
            return 'outer';
        }

        const outerTree = renderToTree(component(ReentrantRoot));
        const snapshot = getAurumDevtoolsRegistry().getSnapshot();
        const outer = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'ReentrantRoot');
        const independent = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'IndependentRoot');

        expect(outer).toBeDefined();
        expect(independent).toBeDefined();
        expect(snapshot.edges).not.toContainEqual(
            expect.objectContaining({ source: outer?.id, target: independent?.id, kind: 'component-child' })
        );

        outerTree.dispose();
        independentTree?.dispose();
    });

    it('retains component ancestry when reactive content renders later', () => {
        configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 20 });
        const content = new DataSource<Renderable>('waiting');

        function ReactiveChild(): Renderable {
            return 'ready';
        }

        function ReactiveParent(): Renderable {
            return content;
        }

        const tree = renderToTree(component(ReactiveParent));
        content.update(component(ReactiveChild));

        const snapshot = getAurumDevtoolsRegistry().getSnapshot();
        const parent = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'ReactiveParent');
        const child = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'ReactiveChild');
        expect(parent).toBeDefined();
        expect(child).toBeDefined();
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: parent?.id, target: child?.id, kind: 'component-child' })
        );

        tree.dispose();
    });

    it('retains component ancestry when promised content resolves later', async () => {
        configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 20 });
        let resolveContent: (content: Renderable) => void = () => undefined;
        const content = new Promise<Renderable>((resolve) => {
            resolveContent = resolve;
        });

        function AsyncChild(): Renderable {
            return 'ready';
        }

        function AsyncParent(): Renderable {
            return content;
        }

        const tree = renderToTree(component(AsyncParent));
        resolveContent(component(AsyncChild));
        await Promise.resolve();

        const snapshot = getAurumDevtoolsRegistry().getSnapshot();
        const parent = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'AsyncParent');
        const child = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'AsyncChild');
        expect(parent).toBeDefined();
        expect(child).toBeDefined();
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: parent?.id, target: child?.id, kind: 'component-child' })
        );

        tree.dispose();
    });

    it('retains component ancestry when an API prerender is requested later', () => {
        configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 20 });
        let componentApi: AurumComponentAPI | undefined;

        function PrerenderedChild(): Renderable {
            return 'child';
        }

        function PrerenderingParent(
            _props: Record<string, never>,
            _children: Renderable[],
            api: AurumComponentAPI
        ): Renderable {
            componentApi = api;
            return 'parent';
        }

        const tree = renderToTree(component(PrerenderingParent));
        const lifeCycle = createLifeCycle();
        componentApi?.prerender(component(PrerenderedChild), lifeCycle);

        const snapshot = getAurumDevtoolsRegistry().getSnapshot();
        const parent = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'PrerenderingParent');
        const child = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'PrerenderedChild');
        expect(parent).toBeDefined();
        expect(child).toBeDefined();
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: parent?.id, target: child?.id, kind: 'component-child' })
        );

        lifeCycle.onDetach();
        tree.dispose();
    });

    it('keeps production rendering lean while retaining source inspection', () => {
        configureAurumDevtools({ mode: 'production', captureStacks: false, historyLimit: 0 });
        const source = new DataSource<Renderable>('production value', 'production source');

        function Component(): Renderable {
            return source;
        }

        const before = new Set(getAurumDevtoolsRegistry().getSnapshot().nodes.map((node) => node.id));
        const tree = renderToTree(component(Component));
        const added = getAurumDevtoolsRegistry()
            .getSnapshot()
            .nodes.filter((node) => !before.has(node.id));

        expect(resolveAurumDevtoolsNodeId(source)).toBeDefined();
        expect(added.filter((node) => node.kind === 'component' || node.kind === 'render-binding')).toEqual([]);
        tree.dispose();
    });
});
