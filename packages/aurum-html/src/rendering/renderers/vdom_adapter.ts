import { Renderable, RenderTree, RenderTreeElementNode, RenderTreeNode, RenderTreePropertyResolver, renderToTree } from '@aurumjs/rendering';
import { CancellationToken } from '@aurumjs/streams';
import { handleClass, handleStyle } from '../../nodes/rendering_helpers.js';

/** @deprecated Use RenderTree from @aurumjs/rendering. */
export { RenderTree as VDOM };
/** @deprecated Use RenderTreeNode from @aurumjs/rendering. */
export type VDOMNode = RenderTreeNode;

export const resolveHTMLRenderTreeProperty: RenderTreePropertyResolver = (
    key: string,
    value: unknown,
    lifetime: CancellationToken,
    _node: RenderTreeElementNode
): unknown => {
    if (key === 'style') return handleStyle(value as Parameters<typeof handleStyle>[0], lifetime);
    if (key === 'class') return handleClass(value as Parameters<typeof handleClass>[0], lifetime);
    return value;
};

export function aurumToRenderTree(content: Renderable, sessionToken: CancellationToken = new CancellationToken()): RenderTree {
    return renderToTree(content, {
        cancellationToken: sessionToken,
        resolveProperty: resolveHTMLRenderTreeProperty
    });
}

/** @deprecated Use aurumToRenderTree or renderToTree. */
export function aurumToVDOM(content: Renderable, sessionToken: CancellationToken): RenderTree {
    return aurumToRenderTree(content, sessionToken);
}
