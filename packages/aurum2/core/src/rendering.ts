import { renderPlugins, reservedIntrinsics } from './plugin';
import { VDomContainerNode, VDomNode, VDomNodeState, VDomNodeType, VDomStaticNode } from './vdom';

type ResolvedRenderable = JsxNode<any> | string | number | boolean | null | undefined;
export type Renderable = ResolvedRenderable | Promise<ResolvedRenderable>;

export interface JsxNode<T> {
    props: T;
    name: string;
    isFragment: boolean;
    isIntrinsic: boolean;
    children: Renderable[];
    factory?(props: T): Renderable;
}

export function createVDOM(
    rootRenderable: Renderable,
    rootPlugin: symbol
): { vdom: VDomNode<any>; triggerAttach: () => void; triggerDetach: () => void; dispose: () => void } {
    const vdom = renderableToVDOM(rootRenderable, undefined, undefined, rootPlugin);

    for (const node of staticvDomIterator(vdom)) {
        const renderPlugin = renderPlugins.get(node.plugin);
        if (renderPlugin) {
            const data = renderPlugin.renderNode?.(node, renderPlugin.config);
            node.renderData = data;
        } else {
            throw new Error(`Illegal state: Node found with unknown or missing plugin ${node.plugin?.toString()}`);
        }
    }

    return {
        vdom: vdom,
        triggerAttach: () => {
            for (const node of staticvDomIterator(vdom)) {
                const renderPlugin = renderPlugins.get(node.plugin);
                if (renderPlugin) {
                    renderPlugin.onNodeAttached?.(node, renderPlugin.config);
                    node.state = VDomNodeState.RENDERED;
                } else {
                    throw new Error(`Illegal state: Node found with unknown or missing plugin ${node.plugin?.toString()}`);
                }
            }
        },
        triggerDetach: () => {
            for (const node of staticvDomIterator(vdom)) {
                const renderPlugin = renderPlugins.get(node.plugin);
                if (renderPlugin) {
                    renderPlugin.onNodeDetached?.(node, renderPlugin.config);
                    node.state = VDomNodeState.DETACHED;
                } else {
                    throw new Error(`Illegal state: Node found with unknown or missing plugin ${node.plugin?.toString()}`);
                }
            }
        },
        dispose: () => {
            for (const node of staticvDomIterator(vdom)) {
                const renderPlugin = renderPlugins.get(node.plugin);
                if (renderPlugin) {
                    renderPlugin.onNodeDisposed?.(node, renderPlugin.config);
                    node.state = VDomNodeState.CREATED;
                } else {
                    throw new Error(`Illegal state: Node found with unknown or missing plugin ${node.plugin?.toString()}`);
                }
            }
        }
    };
}

function* staticvDomIterator(vdom: VDomNode<any>): Iterable<VDomStaticNode<any>> {
    if (vdom.type === VDomNodeType.STATIC) {
        yield vdom;
    }
    if (vdom.children) {
        for (const child of vdom.children) {
            yield* staticvDomIterator(child);
        }
    }
}

function renderableToVDOM(
    rootRenderable: string | number | boolean | JsxNode<any> | Promise<ResolvedRenderable>,
    parent: VDomNode<any>,
    staticParent: VDomStaticNode<any>,
    currentPlugin: symbol
): VDomNode<any> {
    if (isPrimitiveRenderable(rootRenderable)) {
        return {
            type: VDomNodeType.STATIC,
            state: VDomNodeState.CREATED,
            staticParent,
            parent,
            inputData: rootRenderable,
            plugin: currentPlugin
        };
    } else {
        const node = rootRenderable as JsxNode<any>;
        if (node.isIntrinsic) {
            const plugin = reservedIntrinsics.get(node.name);
            const result: VDomStaticNode<any> = {
                children: undefined,
                inputData: {
                    name: node.name,
                    props: node.props
                },
                type: VDomNodeType.STATIC,
                state: VDomNodeState.CREATED,
                staticParent: staticParent,
                parent,
                plugin: plugin.targetNodeSymbol
            };
            if (!plugin) {
                throw new Error(`No plugin found for intrinsic element ${node.name}`);
            }
            if (node.children) {
                result.children = (rootRenderable as JsxNode<any>).children.map((n) => renderableToVDOM(n, result, result, currentPlugin));
            }

            return result;
        } else if (node.isFragment) {
            const result: VDomContainerNode = {
                children: undefined,
                type: VDomNodeType.CONTAINER,
                parent,
                staticParent: staticParent
            };
            const children = node.children.map((n) => renderableToVDOM(n, result, staticParent, currentPlugin));
            result.children = children;
            return result;
        } else if (node.factory) {
            return renderableToVDOM(node.factory(node.props), parent, staticParent, currentPlugin);
        } else {
            throw new Error(`Illegal state: JsxNode with no factory or intrinsic element found`);
        }
    }
}

export function isPrimitiveRenderable(renderable: Renderable): boolean {
    return (
        typeof renderable === 'string' || typeof renderable === 'number' || typeof renderable === 'boolean' || renderable === null || renderable === undefined
    );
}
