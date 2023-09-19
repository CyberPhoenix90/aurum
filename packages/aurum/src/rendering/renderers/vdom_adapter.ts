import { AurumElementModel, createAPI, Renderable } from '../aurum_element.js';
import { ArrayDataSource, DataSource } from '../../stream/data_source.js';
import { DuplexDataSource } from '../../stream/duplex_data_source.js';
import { CancellationToken } from '../../utilities/cancellation_token.js';
import { handleClass, handleStyle } from '../../nodes/rendering_helpers.js';
import { EventEmitter } from '../../utilities/event_emitter.js';

export class VDOM {
    roots: VDOMNode[];
    onChange: EventEmitter<{ changedNode: VDOMNode }>;
    sessionToken: CancellationToken;
    constructor(args: { vdom: VDOMNode[]; sessionToken: CancellationToken }) {
        this.roots = args.vdom;
        this.sessionToken = args.sessionToken;
        this.onChange = new EventEmitter<{
            changedNode: VDOMNode;
        }>();
    }

    *[Symbol.iterator](): Iterator<{ node: VDOMNode; parent: VDOMNode }> {
        for (const node of this.roots) {
            yield* this.iterateVDOM(node, undefined);
        }
    }

    private *iterateVDOM(node: VDOMNode, parent: VDOMNode): Generator<{ node: VDOMNode; parent: VDOMNode }> {
        if (node.type === 'virtual') {
            for (const child of node.children) {
                yield* this.iterateVDOM(child, parent);
            }
            return;
        }

        yield { node, parent };
        if (node.children) {
            for (const child of node.children) {
                yield* this.iterateVDOM(child, node);
            }
        }
    }
}

export interface VDOMNode {
    type: 'text' | 'element' | 'virtual';
    tag?: string;
    attributes?: { [key: string]: string };
    parent?: VDOMNode;
    children?: VDOMNode[];
    text?: string;
}

export function aurumToVDOM(content: Renderable | Renderable[], sessionToken: CancellationToken): VDOM {
    const root: VDOM = new VDOM({
        vdom: [],
        sessionToken
    });
    let renderToken = new CancellationToken();
    sessionToken.addCancellable(() => {
        if (renderToken) {
            renderToken.cancel();
        }
    });
    const virtualRoot: VDOMNode = {
        type: 'virtual',
        children: []
    };
    aurumToVDOMInternal(content, renderToken, root.onChange, virtualRoot);
    root.roots = virtualRoot.children;
    return root;
}

function aurumToVDOMInternal(
    content: Renderable | Renderable[],
    renderToken: CancellationToken,
    change: EventEmitter<{ changedNode: VDOMNode }>,
    parent: VDOMNode
): {
    tokens: CancellationToken[];
} {
    if (content === undefined || content === null) {
        return {
            tokens: []
        };
    }

    if (Array.isArray(content)) {
        const result = {
            insertAt: -1,
            insertCount: 0,
            tokens: []
        };
        for (const item of content) {
            const output = aurumToVDOMInternal(item, renderToken, change, parent);
            result.tokens.push(...output.tokens);
        }
        return result;
    }

    if (content instanceof Promise) {
        const virtualNode: VDOMNode = {
            type: 'virtual',
            children: []
        };

        content.then((c) => {
            aurumToVDOMInternal(c, renderToken, change, virtualNode);
            change.fire({
                changedNode: parent
            });
        });

        parent.children.push(virtualNode);
        return {
            tokens: []
        };
    }

    if (['number', 'string', 'bigint', 'boolean'].includes(typeof content)) {
        parent.children.push({
            type: 'text',
            text: content.toString()
        });
        return {
            tokens: []
        };
    } else if (content instanceof DataSource || content instanceof DuplexDataSource) {
        const virtualNode: VDOMNode = {
            type: 'virtual',
            children: []
        };

        content.listen((v) => {
            virtualNode.children = [];
            insertStats.tokens.forEach((t) => t.cancel());
            insertStats = aurumToVDOMInternal(v, renderToken, change, virtualNode);
            change.fire({
                changedNode: parent
            });
        }, renderToken);

        parent.children.push(virtualNode);
        let insertStats = aurumToVDOMInternal(content.value, renderToken, change, virtualNode);
        return insertStats;
    } else if (content instanceof ArrayDataSource) {
        const virtualNode: VDOMNode = {
            type: 'virtual',
            children: []
        };

        content.listen(() => {
            virtualNode.children = [];
            insertStats.tokens.forEach((t) => t.cancel());
            insertStats = aurumToVDOMInternal(content.getData() as Renderable[], renderToken, change, virtualNode);
            change.fire({
                changedNode: parent
            });
        }, renderToken);

        parent.children.push(virtualNode);
        let insertStats = aurumToVDOMInternal(content.getData() as Renderable[], renderToken, change, virtualNode);
        return insertStats;
    } else {
        const item = content as AurumElementModel<any>;
        if (!item.isIntrinsic) {
            const sessionToken = new CancellationToken();
            const session = {
                attachCalls: [],
                sessionToken: sessionToken,
                tokens: []
            };
            const api = createAPI(session);

            renderToken.addCancellable(() => {
                sessionToken.cancel();
            });

            sessionToken.addCancellable(() => {
                for (const token of session.tokens) {
                    token.cancel();
                }
            });
            const data = aurumToVDOMInternal(item.factory(item.props, item.children, api), sessionToken, change, parent);
            for (const call of session.attachCalls) {
                call();
            }

            return {
                tokens: [...data.tokens, sessionToken]
            };
        }

        const element: VDOMNode = {
            type: 'element',
            tag: item.name,
            children: []
        };
        element.attributes = item.props ? observeAttributes(element, item.props, renderToken, change) : undefined;

        parent.children.push(element);

        if (item.props?.onAttach) {
            item.props.onAttach();
        }

        if (item.props?.onDetach) {
            renderToken.addCancellable(() => {
                item.props.onDetach();
            });
        }

        if (item.children) {
            aurumToVDOMInternal(item.children, renderToken, change, element);
        }

        return {
            tokens: []
        };
    }
}

function observeAttributes(
    node: VDOMNode,
    props: any,
    renderToken: CancellationToken,
    change: EventEmitter<{ changedNode: VDOMNode }>
): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    for (const key in props) {
        let element;
        if (props.hasOwnProperty(key)) {
            if (key === 'style') {
                element = handleStyle(props[key], renderToken);
            } else if (key === 'class') {
                element = handleClass(props[key], renderToken);
            } else {
                element = props[key];
            }

            if (element instanceof DataSource) {
                element.listen(() => {
                    result[key] = element.value;
                    change.fire({
                        changedNode: node
                    });
                }, renderToken);
                result[key] = element.value;
            } else if (element instanceof DuplexDataSource) {
                element.listen(() => {
                    result[key] = element.value;
                    change.fire({
                        changedNode: node
                    });
                }, renderToken);
                result[key] = element.value;
            } else if (element instanceof ArrayDataSource) {
                element.listen(() => {
                    result[key] = element.getData().join(';');
                    change.fire({
                        changedNode: node
                    });
                }, renderToken);
                result[key] = element.getData().join(';');
            } else {
                result[key] = element;
            }
        }
    }
    return result;
}
