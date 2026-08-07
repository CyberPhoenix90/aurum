import { afterEach, describe, expect, it } from 'vitest';
import {
    Aurum,
    configureAurumDevtools,
    DataSource,
    getAurumDevtoolsRegistry,
    Renderable,
    resolveAurumDevtoolsNodeId
} from '../../src/index.js';

describe('HTML developer tooling', () => {
    afterEach(() => {
        configureAurumDevtools({ mode: 'production', captureStacks: false, historyLimit: 0 });
        getAurumDevtoolsRegistry().clearHistory();
        document.body.replaceChildren();
    });

    it('links component content and attributes to their source nodes in debug mode', () => {
        configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 20 });
        expect((globalThis as Record<PropertyKey, unknown>)[Symbol.for('@aurum/devtools')]).toBe(getAurumDevtoolsRegistry());
        const title = new DataSource('initial title', 'title');
        const content = new DataSource<Renderable>('initial content', 'content');

        function Application(): Renderable {
            return <div title={title}>{content}</div>;
        }

        const host = document.createElement('main');
        document.body.appendChild(host);
        const lifetime = Aurum.attach(<Application />, host);
        const snapshot = getAurumDevtoolsRegistry().getSnapshot();
        const titleId = resolveAurumDevtoolsNodeId(title);
        const contentId = resolveAurumDevtoolsNodeId(content);
        const application = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'Application');
        const elementBinding = snapshot.nodes.find((node) => node.kind === 'render-binding' && node.name === '<div>');
        const contentBinding = snapshot.nodes.find(
            (node) => node.kind === 'render-binding' && node.name === 'SingularAurumElement'
        );

        expect(application).toBeDefined();
        expect(elementBinding).toBeDefined();
        expect(contentBinding).toBeDefined();
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: titleId, target: elementBinding?.id, kind: 'render', label: 'attribute:title' })
        );
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: contentId, target: contentBinding?.id, kind: 'render', label: 'DOM reactive content' })
        );
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: application?.id, target: elementBinding?.id, kind: 'component-output' })
        );

        const rendererIds = snapshot.nodes
            .filter((node) => node.kind === 'component' || node.kind === 'render-binding')
            .map((node) => node.id);
        lifetime.cancel();
        const afterDispose = getAurumDevtoolsRegistry().getSnapshot();
        expect(afterDispose.nodes.filter((node) => rendererIds.includes(node.id))).toEqual([]);
    });

    it('keeps the owning component for descendants added by reactive DOM content', () => {
        configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 20 });
        const content = new DataSource<Renderable>('waiting');

        function ReactiveChild(): Renderable {
            return <span>ready</span>;
        }

        function ReactiveApplication(): Renderable {
            return <div>{content}</div>;
        }

        const host = document.createElement('main');
        document.body.appendChild(host);
        const lifetime = Aurum.attach(<ReactiveApplication />, host);
        content.update(<ReactiveChild />);

        const snapshot = getAurumDevtoolsRegistry().getSnapshot();
        const parent = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'ReactiveApplication');
        const child = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'ReactiveChild');
        expect(parent).toBeDefined();
        expect(child).toBeDefined();
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: parent?.id, target: child?.id, kind: 'component-child' })
        );

        lifetime.cancel();
    });
});
