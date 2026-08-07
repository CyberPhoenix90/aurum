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
        const elementBinding = snapshot.nodes.find((node) => node.kind === 'dom-element' && node.name === '<div>');
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

        const registry = getAurumDevtoolsRegistry();
        expect(registry.capabilities).toContain('dom-highlighting');
        expect(registry.highlightDomNode?.(elementBinding!.id)).toBe(true);
        expect(document.querySelector('[data-aurum-devtools-highlight]')?.getAttribute('data-aurum-devtools-highlight')).toBe(
            elementBinding!.id
        );
        registry.clearDomNodeHighlight?.();
        expect(document.querySelector('[data-aurum-devtools-highlight]')).toBeNull();
        expect(registry.highlightDomNode?.(application!.id)).toBe(false);

        const rendererIds = snapshot.nodes
            .filter((node) => node.kind === 'component' || node.kind === 'render-binding')
            .map((node) => node.id);
        lifetime.cancel();
        const afterDispose = getAurumDevtoolsRegistry().getSnapshot();
        expect(afterDispose.nodes.filter((node) => rendererIds.includes(node.id))).toEqual([]);
    });

    it('records component and static host DOM hierarchy in debug mode', () => {
        configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 20 });

        function Child(): Renderable {
            return <span>child</span>;
        }

        function Application(): Renderable {
            return (
                <main>
                    <div>
                        <Child />
                    </div>
                </main>
            );
        }

        const host = document.createElement('section');
        document.body.appendChild(host);
        const lifetime = Aurum.attach(<Application />, host);
        const snapshot = getAurumDevtoolsRegistry().getSnapshot();
        const application = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'Application');
        const child = snapshot.nodes.find((node) => node.kind === 'component' && node.name === 'Child');
        const main = snapshot.nodes.find((node) => node.kind === 'dom-element' && node.name === '<main>');
        const div = snapshot.nodes.find((node) => node.kind === 'dom-element' && node.name === '<div>');
        const span = snapshot.nodes.find((node) => node.kind === 'dom-element' && node.name === '<span>');

        expect(application).toBeDefined();
        expect(child).toBeDefined();
        expect(main).toBeDefined();
        expect(div).toBeDefined();
        expect(span).toBeDefined();
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: application?.id, target: child?.id, kind: 'component-child' })
        );
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: application?.id, target: main?.id, kind: 'component-output' })
        );
        expect(snapshot.edges).toContainEqual(expect.objectContaining({ source: main?.id, target: div?.id, kind: 'dom-child' }));
        expect(snapshot.edges).toContainEqual(expect.objectContaining({ source: div?.id, target: span?.id, kind: 'dom-child' }));
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: child?.id, target: span?.id, kind: 'component-output' })
        );

        lifetime.cancel();
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
        const div = snapshot.nodes.find((node) => node.kind === 'dom-element' && node.name === '<div>');
        const span = snapshot.nodes.find((node) => node.kind === 'dom-element' && node.name === '<span>');
        expect(parent).toBeDefined();
        expect(child).toBeDefined();
        expect(snapshot.edges).toContainEqual(
            expect.objectContaining({ source: parent?.id, target: child?.id, kind: 'component-child' })
        );
        expect(snapshot.edges).toContainEqual(expect.objectContaining({ source: div?.id, target: span?.id, kind: 'dom-child' }));

        lifetime.cancel();
    });

    it('does not register component or DOM inspection nodes in production mode', () => {
        configureAurumDevtools({ mode: 'production', captureStacks: false, historyLimit: 0 });

        function ProductionApplication(): Renderable {
            return <div><span>production</span></div>;
        }

        const before = new Set(getAurumDevtoolsRegistry().getSnapshot().nodes.map((node) => node.id));
        const lifetime = Aurum.attach(<ProductionApplication />, document.body);
        const added = getAurumDevtoolsRegistry()
            .getSnapshot()
            .nodes.filter((node) => !before.has(node.id));
        expect(added.filter((node) => node.kind === 'component' || node.kind === 'dom-element')).toEqual([]);
        lifetime.cancel();
    });
});
