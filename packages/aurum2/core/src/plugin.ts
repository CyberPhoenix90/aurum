import { VDomStaticNode } from './vdom';
export interface RenderPlugin<T, C> {
    name: string;
    targetNodeSymbol: symbol;
    renderNode?: (node: VDomStaticNode, config: C) => void;
    onNodeAttached?: (node: VDomStaticNode, config: C) => void;
    onNodeDetached?: (node: VDomStaticNode, config: C) => void;
    onNodeDisposed?: (node: VDomStaticNode, config: C) => void;
    onNodeChildrenChanged?: (node: VDomStaticNode, rendered: T, change: T[], config: C) => void;
    config: C;
    intrinsics?: string[];
}

export function registerRenderPlugin(renderPlugin: RenderPlugin<any, any>) {
    if (renderPlugins.has(renderPlugin.targetNodeSymbol)) {
        throw new Error(
            `Render plugin ${renderPlugin.name} already registered. If this is unexpected maybe you included 2 copies of the same plugin in your build?`
        );
    } else {
        renderPlugins.set(renderPlugin.targetNodeSymbol, renderPlugin);
        if (renderPlugin.intrinsics) {
            for (const intrinsic of renderPlugin.intrinsics) {
                if (!reservedIntrinsics.has(intrinsic)) {
                    reservedIntrinsics.set(intrinsic, renderPlugin);
                } else {
                    throw new Error(`Intrinsic ${intrinsic} already reserved by plugin ${reservedIntrinsics.get(intrinsic)?.name}`);
                }
            }
        }
    }
}

export const vdomNodeSymbol = Symbol('vdomNode');

export const renderPlugins = new Map<symbol, RenderPlugin<symbol, RenderPlugin<any, any>>>();
export const reservedIntrinsics = new Map<string, RenderPlugin<symbol, RenderPlugin<any, any>>>();
