import { ArrayDataSource, CancellationToken, CollectionChange, CollectionItemIdentity, DataSource, EventEmitter } from '@aurum/streams';
import {
    AurumElementModel,
    aurumElementModelIdentitiy,
    createAPI,
    createRenderSession,
    prerenderComponents,
    Renderable,
    RenderSession
} from './aurum_element.js';
import { isAurumDevtoolsDebugBuild, registerAurumRenderBinding, traceAurumComponentRender } from '../devtools.js';

export interface RendererHost<Node> {
    createElement(name: string, properties: Record<string, unknown>): Node;
    createText(value: string): Node;
    createRange(): Node;
    insert(parent: Node | undefined, index: number, node: Node): void;
    remove(parent: Node | undefined, index: number, count: number): void;
    move(parent: Node | undefined, from: number, to: number): void;
    setText(node: Node, value: string): void;
    setProperty(node: Node, key: string, value: unknown): void;
    dispose?(node: Node): void;
}

interface RenderTreeNodeBase {
    readonly id: number;
    type: 'text' | 'element' | 'virtual';
    parent?: RenderTreeNode;
    children?: RenderTreeNode[];
    tag?: string;
    text?: string;
    properties?: Record<string, unknown>;
    /** Compatibility name retained for the former VDOM adapter. */
    attributes?: Record<string, unknown>;
}

export interface RenderTreeTextNode extends RenderTreeNodeBase {
    type: 'text';
    text: string;
}

export interface RenderTreeElementNode extends RenderTreeNodeBase {
    type: 'element';
    tag: string;
    children: RenderTreeNode[];
    properties: Record<string, unknown>;
    attributes: Record<string, unknown>;
}

export interface RenderTreeRangeNode extends RenderTreeNodeBase {
    type: 'virtual';
    children: RenderTreeNode[];
}

export type RenderTreeNode = RenderTreeTextNode | RenderTreeElementNode | RenderTreeRangeNode;

export type RenderTreePatch =
    | { type: 'insert'; parent?: RenderTreeNode; index: number; nodes: RenderTreeNode[] }
    | { type: 'remove'; parent?: RenderTreeNode; index: number; nodes: RenderTreeNode[] }
    | { type: 'move'; parent?: RenderTreeNode; from: number; to: number; node: RenderTreeNode }
    | { type: 'set-text'; node: RenderTreeTextNode; previousValue: string; value: string }
    | { type: 'set-property'; node: RenderTreeElementNode; key: string; previousValue: unknown; value: unknown };

export type RenderTreePropertyResolver = (
    key: string,
    value: unknown,
    lifetime: CancellationToken,
    node: RenderTreeElementNode
) => unknown;

export interface RenderTreeOptions {
    cancellationToken?: CancellationToken;
    resolveProperty?: RenderTreePropertyResolver;
    onError?: (error: Error) => void;
}

/**
 * A host-neutral, persistent rendering target. Virtual nodes represent reactive
 * ranges and are transparent when iterating over the tree.
 */
export class RenderTree implements RendererHost<RenderTreeNode> {
    public roots: RenderTreeNode[];
    public readonly onPatch = new EventEmitter<RenderTreePatch>();
    public readonly onChange = new EventEmitter<{ changedNode: RenderTreeNode }>();
    public readonly onError = new EventEmitter<Error>();
    public readonly sessionToken: CancellationToken;
    private nextNodeId = 1;

    constructor(args?: { roots?: RenderTreeNode[]; vdom?: RenderTreeNode[]; sessionToken?: CancellationToken }) {
        this.roots = args?.roots ?? args?.vdom ?? [];
        this.sessionToken = args?.sessionToken ?? new CancellationToken();
        if (!this.sessionToken.isCancelled) {
            this.sessionToken.addCancellable(() => {
                this.onPatch.cancelAll();
                this.onChange.cancelAll();
                this.onError.cancelAll();
            });
        }
    }

    public createElement(name: string, properties: Record<string, unknown> = {}): RenderTreeElementNode {
        return {
            id: this.nextNodeId++,
            type: 'element',
            tag: name,
            children: [],
            properties,
            attributes: properties
        };
    }

    public createText(value: string): RenderTreeTextNode {
        return { id: this.nextNodeId++, type: 'text', text: value };
    }

    public createRange(): RenderTreeRangeNode {
        return { id: this.nextNodeId++, type: 'virtual', children: [] };
    }

    public insert(parent: RenderTreeNode | undefined, index: number, node: RenderTreeNode): void {
        const children = parent ? ensureChildren(parent) : this.roots;
        children.splice(index, 0, node);
        node.parent = parent;
        if (this.hasChangeObservers()) this.emitPatch({ type: 'insert', parent, index, nodes: [node] }, parent ?? node);
    }

    public remove(parent: RenderTreeNode | undefined, index: number, count: number): void {
        const children = parent ? ensureChildren(parent) : this.roots;
        const nodes = children.splice(index, count);
        for (const node of nodes) node.parent = undefined;
        if (nodes.length > 0 && this.hasChangeObservers()) this.emitPatch({ type: 'remove', parent, index, nodes }, parent ?? nodes[0]);
    }

    public move(parent: RenderTreeNode | undefined, from: number, to: number): void {
        if (from === to) return;
        const children = parent ? ensureChildren(parent) : this.roots;
        const [node] = children.splice(from, 1);
        children.splice(to, 0, node);
        if (this.hasChangeObservers()) this.emitPatch({ type: 'move', parent, from, to, node }, parent ?? node);
    }

    public setText(node: RenderTreeTextNode, value: string): void {
        if (node.text === value) return;
        const previousValue = node.text;
        node.text = value;
        if (this.hasChangeObservers()) this.emitPatch({ type: 'set-text', node, previousValue, value }, node);
    }

    public setProperty(node: RenderTreeElementNode, key: string, value: unknown): void {
        const previousValue = node.properties[key];
        if (Object.is(previousValue, value)) return;
        node.properties[key] = value;
        if (this.hasChangeObservers()) this.emitPatch({ type: 'set-property', node, key, previousValue, value }, node);
    }

    public dispose(): void {
        this.sessionToken.cancel();
    }

    public reportError(error: unknown): void {
        if (this.sessionToken.isCancelled) return;
        this.onError.fire(error instanceof Error ? error : new Error(String(error)));
    }

    public *[Symbol.iterator](): Iterator<{ node: RenderTreeNode; parent?: RenderTreeNode }> {
        for (const node of this.roots) yield* this.iterate(node, undefined);
    }

    private *iterate(node: RenderTreeNode, parent?: RenderTreeNode): Generator<{ node: RenderTreeNode; parent?: RenderTreeNode }> {
        if (node.type === 'virtual') {
            for (const child of node.children) yield* this.iterate(child, parent);
            return;
        }
        yield { node, parent };
        for (const child of node.children ?? []) yield* this.iterate(child, node);
    }

    private emitPatch(patch: RenderTreePatch, changedNode: RenderTreeNode): void {
        if (this.sessionToken.isCancelled) return;
        this.onPatch.fire(patch);
        this.onChange.fire({ changedNode });
    }

    private hasChangeObservers(): boolean {
        return !this.sessionToken.isCancelled && (this.onPatch.hasSubscriptions() || this.onChange.hasSubscriptions());
    }
}

export function renderToTree(content: Renderable, options: RenderTreeOptions | CancellationToken = {}): RenderTree {
    const normalizedOptions: RenderTreeOptions = options instanceof CancellationToken ? { cancellationToken: options } : options;
    const lifetime = normalizedOptions.cancellationToken ?? new CancellationToken();
    const tree = new RenderTree({ sessionToken: lifetime });
    if (normalizedOptions.onError) tree.onError.subscribe(normalizedOptions.onError, lifetime);
    renderContent(content, lifetime, undefined, tree, normalizedOptions.resolveProperty);
    return tree;
}

export interface HostedRender<Node> {
    readonly tree: RenderTree;
    readonly cancellationToken: CancellationToken;
    readonly roots: Node[];
    dispose(): void;
}

/**
 * Mirrors a RenderTree into a custom host. Extensions that benefit from an
 * inspectable tree can consume RenderTree directly; hosts can use this helper
 * to receive the same incremental operations without implementing traversal.
 */
export function renderToHost<Node>(
    content: Renderable,
    host: RendererHost<Node>,
    options: RenderTreeOptions | CancellationToken = {}
): HostedRender<Node> {
    const tree = renderToTree(content, options);
    const nodes = new WeakMap<RenderTreeNode, Node>();

    const materialize = (source: RenderTreeNode, parent: RenderTreeNode | undefined, index: number): Node => {
        let target: Node;
        if (source.type === 'text') target = host.createText(source.text);
        else if (source.type === 'virtual') target = host.createRange();
        else target = host.createElement(source.tag, { ...source.properties });
        nodes.set(source, target);
        host.insert(parent ? nodes.get(parent) : undefined, index, target);
        for (let childIndex = 0; childIndex < (source.children?.length ?? 0); childIndex++) {
            materialize(source.children[childIndex], source, childIndex);
        }
        return target;
    };

    const disposeNode = (source: RenderTreeNode): void => {
        for (const child of source.children ?? []) disposeNode(child);
        const target = nodes.get(source);
        if (target !== undefined) host.dispose?.(target);
        nodes.delete(source);
    };

    for (let index = 0; index < tree.roots.length; index++) materialize(tree.roots[index], undefined, index);

    if (!tree.sessionToken.isCancelled) {
        tree.onPatch.subscribe((patch) => {
            switch (patch.type) {
                case 'insert':
                    for (let offset = 0; offset < patch.nodes.length; offset++) {
                        materialize(patch.nodes[offset], patch.parent, patch.index + offset);
                    }
                    break;
                case 'remove':
                    host.remove(patch.parent ? nodes.get(patch.parent) : undefined, patch.index, patch.nodes.length);
                    for (const node of patch.nodes) disposeNode(node);
                    break;
                case 'move':
                    host.move(patch.parent ? nodes.get(patch.parent) : undefined, patch.from, patch.to);
                    break;
                case 'set-text':
                    host.setText(nodes.get(patch.node), patch.value);
                    break;
                case 'set-property':
                    host.setProperty(nodes.get(patch.node), patch.key, patch.value);
                    break;
            }
        }, tree.sessionToken);

        tree.sessionToken.addCancellable(() => {
            host.remove(undefined, 0, tree.roots.length);
            for (const root of tree.roots) disposeNode(root);
        });
    }

    return {
        tree,
        cancellationToken: tree.sessionToken,
        get roots() {
            if (tree.sessionToken.isCancelled) return [];
            return tree.roots.map((root) => nodes.get(root));
        },
        dispose: () => tree.dispose()
    };
}

function renderContent(
    content: Renderable,
    lifetime: CancellationToken,
    parent: RenderTreeNode | undefined,
    tree: RenderTree,
    resolveProperty?: RenderTreePropertyResolver,
    renderSession?: RenderSession,
    index?: number
): RenderTreeNode[] {
    if (content === undefined || content === null || lifetime.isCancelled) return [];
    const targetIndex = index ?? (parent ? ensureChildren(parent).length : tree.roots.length);

    if (Array.isArray(content)) {
        const nodes: RenderTreeNode[] = [];
        let offset = 0;
        for (const item of content) {
            const inserted = renderContent(item, lifetime, parent, tree, resolveProperty, renderSession, targetIndex + offset);
            nodes.push(...inserted);
            offset += inserted.length;
        }
        return nodes;
    }

    if (content instanceof Promise) {
        const range = tree.createRange();
        tree.insert(parent, targetIndex, range);
        const scope = new OwnedLifetime(lifetime);
        const deferredRenderScope = captureRenderScope(renderSession, scope.token);
        content.then(
            (resolved) => {
                if (!scope.token.isCancelled) {
                    renderContent(resolved, scope.token, range, tree, resolveProperty, deferredRenderScope);
                }
            },
            (error) => {
                if (!scope.token.isCancelled) tree.reportError(error);
            }
        );
        return [range];
    }

    if (isPrimitive(content)) {
        const text = tree.createText(String(content));
        tree.insert(parent, targetIndex, text);
        return [text];
    }

    if (content instanceof DataSource) {
        return renderDataSource(content, lifetime, parent, targetIndex, tree, resolveProperty, renderSession);
    }

    if (content instanceof ArrayDataSource) {
        return renderArrayDataSource(content, lifetime, parent, targetIndex, tree, resolveProperty, renderSession);
    }

    const model = content as AurumElementModel<any>;
    if (!model?.[aurumElementModelIdentitiy]) {
        throw new Error(`Unsupported renderable ${model?.constructor?.name ?? typeof content}`);
    }

    if (!model.isIntrinsic) {
        const session = createRenderSession(renderSession);
        const unlink = linkLifetime(lifetime, session.sessionToken);
        session.sessionToken.addCancellable(unlink);
        return traceAurumComponentRender(model, session, () => {
            let output: Renderable;
            try {
                output = model.factory(model.props ?? {}, model.children, createAPI(session, prerenderComponents));
            } catch (error) {
                session.sessionToken.cancel();
                tree.reportError(error);
                throw error;
            }
            const nodes = renderContent(output, session.sessionToken, parent, tree, resolveProperty, session, targetIndex);
            for (const attach of session.attachCalls) attach();
            return nodes;
        });
    }

    const element = tree.createElement(model.name);
    tree.insert(parent, targetIndex, element);
    observeProperties(element, model.props, lifetime, tree, resolveProperty, renderSession);
    renderContent(model.children, lifetime, element, tree, resolveProperty, renderSession);
    const onAttach = model.props?.onAttach;
    const onDetach = model.props?.onDetach;
    if (typeof onDetach === 'function') lifetime.addCancellable(() => onDetach(element));
    if (typeof onAttach === 'function') onAttach(element);
    return [element];
}

function renderDataSource(
    source: DataSource<Renderable>,
    lifetime: CancellationToken,
    parent: RenderTreeNode | undefined,
    index: number,
    tree: RenderTree,
    resolveProperty?: RenderTreePropertyResolver,
    renderSession?: RenderSession
): RenderTreeNode[] {
    const range = tree.createRange();
    tree.insert(parent, index, range);
    registerAurumRenderBinding(source, range, 'reactive content', lifetime, renderSession);
    const deferredRenderScope = captureRenderScope(renderSession, lifetime);
    let contentScope: OwnedLifetime | undefined;
    let hasValue = false;
    let previousValue: unknown;

    source.listenAndRepeat((value) => {
        if (lifetime.isCancelled) return;
        if (hasValue && Object.is(previousValue, value)) return;
        hasValue = true;
        previousValue = value;
        contentScope?.dispose();
        contentScope = new OwnedLifetime(lifetime);
        if (isPrimitive(value) && range.children.length === 1 && range.children[0].type === 'text') {
            tree.setText(range.children[0], String(value));
            return;
        }
        tree.remove(range, 0, range.children.length);
        renderContent(value, contentScope.token, range, tree, resolveProperty, deferredRenderScope);
    }, lifetime);

    return [range];
}

interface ArrayRenderEntry {
    identity: CollectionItemIdentity;
    sourceValue: unknown;
    nodes: RenderTreeNode[];
    scope: OwnedLifetime;
    rendered: boolean;
}

function renderArrayDataSource(
    source: ArrayDataSource<Renderable>,
    lifetime: CancellationToken,
    parent: RenderTreeNode | undefined,
    index: number,
    tree: RenderTree,
    resolveProperty?: RenderTreePropertyResolver,
    renderSession?: RenderSession
): RenderTreeNode[] {
    const range = tree.createRange();
    tree.insert(parent, index, range);
    registerAurumRenderBinding(source, range, 'reactive collection', lifetime, renderSession);
    const deferredRenderScope = captureRenderScope(renderSession, lifetime);
    const initialValues = source.getData();
    const initialIdentities = source.getItemIdentities();
    let entries: ArrayRenderEntry[] = [];

    const createEntry = (sourceValue: unknown, identity: CollectionItemIdentity): ArrayRenderEntry => {
        const scope = new OwnedLifetime(lifetime);
        return { identity, sourceValue, nodes: [], scope, rendered: false };
    };

    const nodeIndexForEntry = (entryIndex: number): number => {
        let nodeIndex = 0;
        for (let index = 0; index < entryIndex; index++) nodeIndex += entries[index].nodes.length;
        return nodeIndex;
    };

    const insertEntries = (entryIndex: number, values: readonly unknown[], identities: readonly CollectionItemIdentity[]): void => {
        let nodeIndex = nodeIndexForEntry(entryIndex);
        const added: ArrayRenderEntry[] = [];
        for (let offset = 0; offset < values.length; offset++) {
            const entry = createEntry(values[offset], identities[offset]);
            entry.rendered = true;
            entry.nodes = renderContent(
                values[offset] as Renderable,
                entry.scope.token,
                range,
                tree,
                resolveProperty,
                deferredRenderScope,
                nodeIndex
            );
            nodeIndex += entry.nodes.length;
            added.push(entry);
        }
        entries.splice(entryIndex, 0, ...added);
    };

    const removeEntries = (entryIndex: number, count: number): void => {
        const nodeIndex = nodeIndexForEntry(entryIndex);
        const removed = entries.splice(entryIndex, count);
        let nodeCount = 0;
        for (const entry of removed) {
            entry.scope.dispose();
            nodeCount += entry.nodes.length;
        }
        if (nodeCount > 0) tree.remove(range, nodeIndex, nodeCount);
    };

    const moveEntry = (from: number, to: number): void => {
        if (from === to) return;
        const currentNodeIndex = nodeIndexForEntry(from);
        const [entry] = entries.splice(from, 1);
        entries.splice(to, 0, entry);
        const targetNodeIndex = nodeIndexForEntry(to);
        if (from < to) {
            const destination = targetNodeIndex + entry.nodes.length - 1;
            for (let offset = 0; offset < entry.nodes.length; offset++) tree.move(range, currentNodeIndex, destination);
        } else {
            for (let offset = 0; offset < entry.nodes.length; offset++) {
                tree.move(range, currentNodeIndex + offset, targetNodeIndex + offset);
            }
        }
    };

    const reconcileMerge = (change: CollectionChange<Renderable>): void => {
        const desiredIdentities = change.newStateIdentities ?? [];
        if (desiredIdentities.length === entries.length && entries.length > 1) {
            let leftRotation = desiredIdentities[desiredIdentities.length - 1] === entries[0].identity;
            for (let index = 0; leftRotation && index < entries.length - 1; index++) {
                leftRotation = desiredIdentities[index] === entries[index + 1].identity;
            }
            if (leftRotation) {
                moveEntry(0, entries.length - 1);
                return;
            }

            let rightRotation = desiredIdentities[0] === entries[entries.length - 1].identity;
            for (let index = 1; rightRotation && index < entries.length; index++) {
                rightRotation = desiredIdentities[index] === entries[index - 1].identity;
            }
            if (rightRotation) {
                moveEntry(entries.length - 1, 0);
                return;
            }
        }
        if (
            desiredIdentities.length === entries.length &&
            !tree.onPatch.hasSubscriptions() &&
            !tree.onChange.hasSubscriptions()
        ) {
            const entriesByIdentity = new Map(entries.map((entry) => [entry.identity, entry]));
            const desiredEntries = desiredIdentities.map((identity) => entriesByIdentity.get(identity));
            if (desiredEntries.every((entry): entry is ArrayRenderEntry => entry !== undefined)) {
                entries = desiredEntries;
                const desiredNodes: RenderTreeNode[] = [];
                for (const entry of entries) desiredNodes.push(...entry.nodes);
                range.children.splice(0, range.children.length, ...desiredNodes);
                return;
            }
        }
        const retained = new Set(desiredIdentities);
        for (let index = entries.length - 1; index >= 0; index--) {
            if (!retained.has(entries[index].identity)) removeEntries(index, 1);
        }
        for (let target = 0; target < desiredIdentities.length; target++) {
            if (entries[target]?.identity === desiredIdentities[target]) continue;
            const currentIndex = entries.findIndex((entry, index) => index > target && entry.identity === desiredIdentities[target]);
            if (currentIndex !== -1) moveEntry(currentIndex, target);
            else insertEntries(target, [change.newState[target]], [desiredIdentities[target]]);
        }
    };

    insertEntries(0, initialValues, initialIdentities);
    source.listen((change) => {
        const identities = change.itemIdentities ?? [];
        switch (change.operationDetailed) {
            case 'append':
            case 'prepend':
            case 'insert':
                insertEntries(change.index, change.items, identities);
                break;
            case 'remove':
            case 'removeLeft':
            case 'removeRight':
            case 'clear':
                removeEntries(change.index, change.count ?? change.items.length);
                break;
            case 'replace':
                removeEntries(change.index, 1);
                insertEntries(change.index, change.items, identities);
                break;
            case 'swap': {
                const low = Math.min(change.index, change.index2);
                const high = Math.max(change.index, change.index2);
                moveEntry(high, low);
                moveEntry(low + 1, high);
                break;
            }
            case 'merge':
                reconcileMerge(change);
                break;
        }
    }, lifetime);
    return [range];
}

function observeProperties(
    node: RenderTreeElementNode,
    props: Record<string, unknown> | undefined,
    lifetime: CancellationToken,
    tree: RenderTree,
    resolveProperty?: RenderTreePropertyResolver,
    renderSession?: RenderSession
): void {
    if (!props) return;
    for (const key of Object.keys(props)) {
        if (key === 'onAttach' || key === 'onDetach' || key === 'decorate') continue;
        const rawValue = resolveProperty ? resolveProperty(key, props[key], lifetime, node) : props[key];
        if (rawValue instanceof DataSource) {
            registerAurumRenderBinding(rawValue, node, `property:${key}`, lifetime, renderSession);
            tree.setProperty(node, key, rawValue.value);
            rawValue.listen((value) => tree.setProperty(node, key, value), lifetime);
        } else if (rawValue instanceof ArrayDataSource) {
            registerAurumRenderBinding(rawValue, node, `property:${key}`, lifetime, renderSession);
            tree.setProperty(node, key, rawValue.getData().slice());
            rawValue.listen(() => tree.setProperty(node, key, rawValue.getData().slice()), lifetime);
        } else {
            tree.setProperty(node, key, rawValue);
        }
    }
}

function captureRenderScope(renderSession: RenderSession | undefined, lifetime: CancellationToken): RenderSession | undefined {
    if (!renderSession || !isAurumDevtoolsDebugBuild()) return renderSession;
    const scope = createRenderSession(renderSession);
    lifetime.addCancellable(scope.sessionToken);
    return scope;
}

class OwnedLifetime {
    public readonly token = new CancellationToken();
    private readonly cancelFromParent: () => void;
    private linked = true;

    constructor(private readonly parent: CancellationToken) {
        this.cancelFromParent = () => this.token.cancel();
        parent.addCancellable(this.cancelFromParent);
    }

    public dispose(): void {
        if (!this.linked) return;
        this.linked = false;
        if (!this.parent.isCancelled) this.parent.removeCancellable(this.cancelFromParent);
        this.token.cancel();
    }
}

function linkLifetime(parent: CancellationToken, child: CancellationToken): () => void {
    const cancelChild = () => child.cancel();
    parent.addCancellable(cancelChild);
    return () => {
        if (!parent.isCancelled) parent.removeCancellable(cancelChild);
    };
}

function ensureChildren(node: RenderTreeNode): RenderTreeNode[] {
    if (!node.children) throw new Error(`Cannot insert children into ${node.type} node`);
    return node.children;
}

function isPrimitive(value: unknown): value is string | number | bigint | boolean {
    const type = typeof value;
    return type === 'string' || type === 'number' || type === 'bigint' || type === 'boolean';
}
