import {
    AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED,
    AurumDevtoolsCancellation,
    aurumDevtools,
    linkAurumDevtoolsNodes,
    registerAurumDevtoolsNode
} from '@aurum/streams';
import type { RenderSession } from './rendering/aurum_element.js';

interface InspectableComponentModel {
    readonly name: string;
    readonly isIntrinsic: boolean;
    readonly props?: unknown;
    readonly children: readonly unknown[];
}

interface ComponentInspectionTarget {
    readonly name: string;
    readonly props: unknown;
    readonly childCount: number;
}

/** @internal Rich renderer relationships are intentionally debug-build only. */
export function isAurumDevtoolsDebugBuild(): boolean {
    return AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED && aurumDevtools.config.mode === 'debug';
}

/** @internal Returns the component owning work performed in this render scope. */
export function getAurumDevtoolsActiveComponent(session: RenderSession | undefined): object | undefined {
    const activeComponents = session?.devtoolsComponentStack;
    return activeComponents?.[activeComponents.length - 1] ?? session?.devtoolsParentComponent;
}

/**
 * Registers one evaluated component instance and keeps its synchronous child
 * evaluations under that instance in the inspection graph.
 *
 * @internal Renderer integration hook.
 */
export function traceAurumComponentRender<T>(model: InspectableComponentModel, session: RenderSession, render: () => T): T {
    if (!isAurumDevtoolsDebugBuild() || model.isIntrinsic) return render();

    const target: ComponentInspectionTarget = {
        name: model.name || 'Anonymous component',
        props: model.props,
        childCount: model.children.length
    };
    session.devtoolsTargets.push(target);
    registerAurumDevtoolsNode(
        target,
        {
            kind: 'component',
            name: target.name,
            getValue: (component) => ({ props: component.props, childCount: component.childCount }),
            metadata: { renderer: 'component', intrinsic: false }
        },
        session.sessionToken
    );

    const activeComponents = (session.devtoolsComponentStack ??= []);
    const parent = getAurumDevtoolsActiveComponent(session);
    if (parent) {
        linkAurumDevtoolsNodes(parent, target, { kind: 'component-child', label: 'renders' }, session.sessionToken);
    }

    activeComponents.push(target);
    try {
        return render();
    } finally {
        activeComponents.pop();
    }
}

/**
 * Links a source to the renderer object that consumes it. DOM nodes, virtual
 * ranges, and custom host nodes can all be used as targets.
 */
export function registerAurumRenderBinding(
    source: object,
    target: object,
    label: string,
    cancellationToken?: AurumDevtoolsCancellation,
    session?: RenderSession
): void {
    if (!isAurumDevtoolsDebugBuild()) return;

    registerAurumDevtoolsNode(
        target,
        {
            kind: 'render-binding',
            name: describeRenderTarget(target),
            metadata: { binding: label }
        },
        cancellationToken
    );
    linkAurumDevtoolsNodes(source, target, { kind: 'render', label }, cancellationToken);

    const component = getAurumDevtoolsActiveComponent(session);
    if (component) {
        linkAurumDevtoolsNodes(component, target, { kind: 'component-output', label }, cancellationToken);
    }
}

function describeRenderTarget(target: object): string {
    try {
        const element = target as { nodeName?: unknown; tag?: unknown; type?: unknown };
        if (typeof element.nodeName === 'string') return `<${element.nodeName.toLowerCase()}>`;
        if (typeof element.tag === 'string') return `<${element.tag}>`;
        if (typeof element.type === 'string') return `${element.type} render range`;
        const name = (target as { constructor?: { name?: unknown } }).constructor?.name;
        return typeof name === 'string' && name ? name : 'Render binding';
    } catch {
        return 'Render binding';
    }
}
