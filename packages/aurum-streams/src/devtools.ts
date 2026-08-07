/**
 * Runtime inspection protocol shared by Aurum renderers and the browser
 * developer tools. The registry deliberately has no dependency on any stream
 * implementation so hosts can register their own nodes without creating
 * package cycles.
 */

declare const __AURUM_DEVTOOLS_MODE__: unknown;
declare const __AURUM_DEVTOOLS_CAPTURE_STACKS__: unknown;
declare const __AURUM_DEVTOOLS_HISTORY_LIMIT__: unknown;
declare const __AURUM_DEVTOOLS_INSTRUMENTATION__: unknown;

/** Compile-time switch used by performance-critical builds to remove graph instrumentation calls. */
export const AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED =
    typeof __AURUM_DEVTOOLS_INSTRUMENTATION__ === 'undefined' || __AURUM_DEVTOOLS_INSTRUMENTATION__ !== false;

/** Compile-time switch for metadata that exists only in debug/development builds. */
export const AURUM_DEVTOOLS_DEBUG_BUILD_ENABLED =
    typeof __AURUM_DEVTOOLS_MODE__ === 'undefined' || __AURUM_DEVTOOLS_MODE__ === 'debug';

export const AURUM_DEVTOOLS_PROTOCOL_VERSION = 1;
export const AURUM_DEVTOOLS_GLOBAL_KEY = '__AURUM_DEVTOOLS__' as const;
export const AURUM_DEVTOOLS_CONFIG_GLOBAL_KEY = '__AURUM_DEVTOOLS_CONFIG__' as const;
export const AURUM_DEVTOOLS_SYMBOL = Symbol.for('@aurum/devtools');

export type AurumDevtoolsMode = 'debug' | 'production';
export type AurumDevtoolsCapability =
    | 'graph'
    | 'events'
    | 'inspect'
    | 'annotations'
    | 'subscriptions'
    | 'array-data-sources'
    | 'component-tree'
    | 'weak-targets'
    | 'dom-highlighting';

export interface AurumDevtoolsConfig {
    mode?: AurumDevtoolsMode;
    captureStacks?: boolean;
    historyLimit?: number;
    previewDepth?: number;
    previewEntries?: number;
    /** Maximum total preview nodes produced by one value or metadata preview. */
    previewNodeBudget?: number;
    /** Bounds strong fallback records in runtimes without WeakRef. */
    fallbackNodeLimit?: number;
}

export interface AurumDevtoolsResolvedConfig {
    mode: AurumDevtoolsMode;
    captureStacks: boolean;
    historyLimit: number;
    previewDepth: number;
    previewEntries: number;
    previewNodeBudget: number;
    fallbackNodeLimit: number;
}

export interface AurumDevtoolsCancellation {
    readonly isCancelled?: boolean;
    addCancellable(callback: () => void): unknown;
}

export interface AurumDevtoolsValuePreview {
    type: string;
    summary: string;
    value?: string | number | boolean | null;
    size?: number;
    entries?: Array<{ key?: string; value: AurumDevtoolsValuePreview }>;
    truncated?: boolean;
}

export interface AurumDevtoolsNodeDescriptor<T extends object = object> {
    kind: string;
    name?: string;
    /**
     * Evaluated only when an inspector requests a snapshot. It receives the
     * weakly held target; avoid closing over the target in this callback.
     */
    getValue?: (target: T) => unknown;
    metadata?: Record<string, unknown>;
}

export interface AurumDevtoolsNodePatch<T extends object = object> {
    kind?: string;
    name?: string;
    getValue?: (target: T) => unknown;
    metadata?: Record<string, unknown>;
}

export interface AurumDevtoolsEdgeDescriptor {
    kind?: string;
    label?: string;
    metadata?: Record<string, unknown>;
}

export interface AurumDevtoolsUpdateDescriptor {
    kind?: string;
    /** Never retained raw; omitted entirely from production inspection data. */
    value?: unknown;
    details?: Record<string, unknown>;
}

export interface AurumDevtoolsNodeSnapshot {
    id: string;
    kind: string;
    name?: string;
    createdAt: number;
    version: number;
    subscriptions: Readonly<Record<string, number>>;
    value?: AurumDevtoolsValuePreview;
    metadata?: Readonly<Record<string, AurumDevtoolsValuePreview>>;
    creationStack?: string;
}

export interface AurumDevtoolsEdgeSnapshot {
    id: string;
    source: string;
    target: string;
    kind: string;
    label?: string;
    createdAt: number;
    metadata?: Readonly<Record<string, AurumDevtoolsValuePreview>>;
}

export type AurumDevtoolsEventType =
    | 'node-added'
    | 'node-updated'
    | 'node-removed'
    | 'edge-added'
    | 'edge-removed'
    | 'subscriptions-changed'
    | 'configured';

export interface AurumDevtoolsEvent {
    sequence: number;
    timestamp: number;
    type: AurumDevtoolsEventType;
    nodeId?: string;
    edgeId?: string;
    updateKind?: string;
    channel?: string;
    count?: number;
    value?: AurumDevtoolsValuePreview;
    details?: Readonly<Record<string, AurumDevtoolsValuePreview>>;
}

export interface AurumDevtoolsSnapshot {
    runtimeId: string;
    revision: number;
    productionLocked: boolean;
    protocolVersion: typeof AURUM_DEVTOOLS_PROTOCOL_VERSION;
    mode: AurumDevtoolsMode;
    weakReferences: boolean;
    nodes: AurumDevtoolsNodeSnapshot[];
    edges: AurumDevtoolsEdgeSnapshot[];
    events: AurumDevtoolsEvent[];
}

export interface AurumDevtoolsSnapshotOptions {
    /** Skip value providers for low-overhead topology polling. */
    includeValues?: boolean;
}

export type AurumDevtoolsNodeReference = object | string;
export type AurumDevtoolsListener = (event: AurumDevtoolsEvent) => void;

export interface AurumDevtoolsRegistry {
    /** Stable for the lifetime of this page runtime. */
    readonly runtimeId: string;
    /** Changes whenever an inspector-visible part of the runtime changes. */
    readonly revision: number;
    /** True when build policy permanently restricts this runtime to production diagnostics. */
    readonly productionLocked: boolean;
    readonly protocolVersion: typeof AURUM_DEVTOOLS_PROTOCOL_VERSION;
    readonly mode: AurumDevtoolsMode;
    readonly capabilities: readonly AurumDevtoolsCapability[];
    readonly config: Readonly<AurumDevtoolsResolvedConfig>;
    readonly weakReferences: boolean;
    configure(config: AurumDevtoolsConfig): void;
    registerNode<T extends object>(target: T, descriptor: AurumDevtoolsNodeDescriptor<T>, cancellationToken?: AurumDevtoolsCancellation): string;
    updateNode<T extends object>(targetOrId: T | string, patch: AurumDevtoolsNodePatch<T>): void;
    unregisterNode(targetOrId: AurumDevtoolsNodeReference): void;
    resolveNodeId(target: object): string | undefined;
    linkNodes(
        source: AurumDevtoolsNodeReference,
        target: AurumDevtoolsNodeReference,
        descriptor?: AurumDevtoolsEdgeDescriptor,
        cancellationToken?: AurumDevtoolsCancellation
    ): string | undefined;
    unlinkEdge(edgeOrId: AurumDevtoolsEdgeSnapshot | string): void;
    emitUpdate(targetOrId: AurumDevtoolsNodeReference, update?: AurumDevtoolsUpdateDescriptor): void;
    setSubscriptionCount(targetOrId: AurumDevtoolsNodeReference, count: number, channel?: string): void;
    annotateNode(targetOrId: AurumDevtoolsNodeReference, annotations: Record<string, unknown>): void;
    inspect(nodeOrId: AurumDevtoolsNodeReference): AurumDevtoolsNodeSnapshot | undefined;
    /** Highlights a registered DOM element without exposing the target across the extension boundary. */
    highlightDomNode?(nodeOrId: AurumDevtoolsNodeReference, duration?: number): boolean;
    clearDomNodeHighlight?(): void;
    getSnapshot(options?: AurumDevtoolsSnapshotOptions): AurumDevtoolsSnapshot;
    subscribe(listener: AurumDevtoolsListener): () => void;
    clearHistory(): void;
}

interface WeakReferenceLike<T extends object> {
    deref(): T | undefined;
}

interface WeakReferenceConstructorLike {
    new <T extends object>(target: T): WeakReferenceLike<T>;
}

interface FinalizationRegistryLike<T> {
    register(target: object, heldValue: T, unregisterToken?: object): void;
    unregister(unregisterToken: object): boolean;
}

interface FinalizationRegistryConstructorLike {
    new <T>(cleanup: (heldValue: T) => void): FinalizationRegistryLike<T>;
}

interface DevtoolsNodeEntry {
    id: string;
    kind: string;
    name?: string;
    createdAt: number;
    version: number;
    subscriptions: Record<string, number>;
    subscriptionChannels: Map<string, number>;
    target: WeakReferenceLike<object> | object;
    getValue?: (target: object) => unknown;
    metadata?: Record<string, AurumDevtoolsValuePreview>;
    creationStack?: string;
    lastValue?: AurumDevtoolsValuePreview;
    finalizationToken?: object;
    registrationCount: number;
}

interface DevtoolsEdgeEntry extends AurumDevtoolsEdgeSnapshot {}

const globalObject = globalThis as unknown as Record<PropertyKey, unknown>;
const pageGlobalAvailable = (() => {
    try {
        return globalObject.window === globalThis && typeof globalObject.document === 'object';
    } catch {
        return false;
    }
})();
const compileTimeConfig = readCompileTimeConfig();
const compileTimeProductionLock = compileTimeConfig.mode === 'production';
let cachedRegistry: AurumDevtoolsRegistry | undefined;
let localRegistry: DefaultAurumDevtoolsRegistry | undefined;

class DefaultAurumDevtoolsRegistry implements AurumDevtoolsRegistry {
    public readonly runtimeId = createRuntimeId();
    public readonly protocolVersion: typeof AURUM_DEVTOOLS_PROTOCOL_VERSION = AURUM_DEVTOOLS_PROTOCOL_VERSION;
    public readonly weakReferences: boolean;

    private resolvedConfig: AurumDevtoolsResolvedConfig;
    private readonly nodes = new Map<string, DevtoolsNodeEntry>();
    private readonly edges = new Map<string, DevtoolsEdgeEntry>();
    private readonly edgeIdsByNode = new Map<string, Set<string>>();
    private readonly idsByTarget = new WeakMap<object, string>();
    private readonly listeners = new Set<AurumDevtoolsListener>();
    private readonly events: AurumDevtoolsEvent[] = [];
    private readonly weakReferenceConstructor?: WeakReferenceConstructorLike;
    private readonly finalizationRegistry?: FinalizationRegistryLike<string>;
    private nodeSequence = 0;
    private edgeSequence = 0;
    private eventSequence = 0;
    private runtimeRevision = 0;
    private highlightedDomNodeId?: string;
    private domHighlightCleanup?: () => void;

    public constructor(config: AurumDevtoolsConfig, public readonly productionLocked: boolean = false) {
        this.resolvedConfig = resolveConfig(config, undefined, productionLocked);
        const constructors = globalThis as unknown as {
            WeakRef?: WeakReferenceConstructorLike;
            FinalizationRegistry?: FinalizationRegistryConstructorLike;
        };
        this.weakReferenceConstructor = constructors.WeakRef;
        this.weakReferences = this.weakReferenceConstructor !== undefined;
        if (this.weakReferences && constructors.FinalizationRegistry) {
            this.finalizationRegistry = new constructors.FinalizationRegistry((id) => this.removeCollectedNode(id));
        }
    }

    public get config(): Readonly<AurumDevtoolsResolvedConfig> {
        return this.resolvedConfig;
    }

    public get revision(): number {
        return this.runtimeRevision;
    }

    public get mode(): AurumDevtoolsMode {
        return this.resolvedConfig.mode;
    }

    public get capabilities(): readonly AurumDevtoolsCapability[] {
        const capabilities: AurumDevtoolsCapability[] = ['graph', 'events', 'inspect', 'subscriptions', 'array-data-sources'];
        if (this.resolvedConfig.mode === 'debug') capabilities.push('annotations', 'component-tree');
        if (this.weakReferences) capabilities.push('weak-targets');
        if (pageGlobalAvailable) capabilities.push('dom-highlighting');
        return Object.freeze(capabilities);
    }

    public configure(config: AurumDevtoolsConfig): void {
        const previousMode = this.resolvedConfig.mode;
        this.resolvedConfig = resolveConfig(config, this.resolvedConfig, this.productionLocked);
        if (previousMode !== this.resolvedConfig.mode) this.clearDomNodeHighlight();
        if (previousMode === 'debug' && this.resolvedConfig.mode === 'production') {
            this.events.length = 0;
            for (const node of this.nodes.values()) {
                node.name = undefined;
                node.metadata = undefined;
                node.creationStack = undefined;
                node.lastValue = undefined;
                node.getValue = undefined;
            }
            for (const edge of this.edges.values()) {
                edge.label = undefined;
                edge.metadata = undefined;
            }
        }
        if (previousMode !== this.resolvedConfig.mode) {
            for (const node of this.nodes.values()) {
                node.subscriptions = projectSubscriptionCounts(node.subscriptionChannels, this.resolvedConfig.mode);
            }
        }
        this.trimHistory();
        this.trimFallbackNodes();
        this.touch();
        this.publish({ type: 'configured' });
    }

    public registerNode<T extends object>(
        target: T,
        descriptor: AurumDevtoolsNodeDescriptor<T>,
        cancellationToken?: AurumDevtoolsCancellation
    ): string {
        assertTarget(target);
        let id = this.idsByTarget.get(target);
        if (id) {
            const entry = this.nodes.get(id);
            if (entry) {
                entry.registrationCount++;
                this.applyPatch(entry, descriptor as AurumDevtoolsNodePatch<object>);
                this.touch();
                attachCancellation(cancellationToken, once(() => this.releaseRegistration(id!)));
                return id;
            }
        }

        id = `aurum:node:${++this.nodeSequence}`;
        const finalizationToken = this.finalizationRegistry ? {} : undefined;
        const entry: DevtoolsNodeEntry = {
            id,
            kind: descriptor.kind,
            name: this.resolvedConfig.mode === 'debug' ? descriptor.name : undefined,
            createdAt: Date.now(),
            version: 0,
            subscriptions: createSubscriptionCountRecord(),
            subscriptionChannels: new Map(),
            target: this.weakReferenceConstructor ? new this.weakReferenceConstructor(target) : target,
            getValue:
                this.resolvedConfig.mode === 'debug'
                    ? (descriptor.getValue as ((target: object) => unknown) | undefined)
                    : undefined,
            metadata: this.resolvedConfig.mode === 'debug' ? previewRecord(descriptor.metadata, this.resolvedConfig) : undefined,
            creationStack: this.resolvedConfig.captureStacks ? captureCreationStack() : undefined,
            finalizationToken,
            registrationCount: 1
        };
        this.nodes.set(id, entry);
        this.idsByTarget.set(target, id);
        if (this.finalizationRegistry && finalizationToken) {
            this.finalizationRegistry.register(target, id, finalizationToken);
        }
        this.trimFallbackNodes();
        this.touch();
        this.publish({ type: 'node-added', nodeId: id });
        attachCancellation(cancellationToken, once(() => this.releaseRegistration(id!)));
        return id;
    }

    public updateNode<T extends object>(targetOrId: T | string, patch: AurumDevtoolsNodePatch<T>): void {
        const entry = this.getEntry(targetOrId);
        if (!entry) return;
        this.applyPatch(entry, patch as AurumDevtoolsNodePatch<object>);
        this.touch();
        this.publish({ type: 'node-updated', nodeId: entry.id, updateKind: 'metadata' });
    }

    public unregisterNode(targetOrId: AurumDevtoolsNodeReference): void {
        const entry = this.getEntry(targetOrId);
        if (!entry) return;
        this.releaseRegistration(entry.id);
    }

    private releaseRegistration(id: string): void {
        const entry = this.nodes.get(id);
        if (!entry) return;
        entry.registrationCount--;
        if (entry.registrationCount > 0) return;
        this.removeNode(entry);
    }

    private removeNode(entry: DevtoolsNodeEntry): void {
        if (this.highlightedDomNodeId === entry.id) this.clearDomNodeHighlight();
        const target = this.dereference(entry);
        if (target) this.idsByTarget.delete(target);
        if (entry.finalizationToken) this.finalizationRegistry?.unregister(entry.finalizationToken);
        this.nodes.delete(entry.id);
        for (const edgeId of Array.from(this.edgeIdsByNode.get(entry.id) ?? [])) this.unlinkEdge(edgeId);
        this.edgeIdsByNode.delete(entry.id);
        this.touch();
        this.publish({ type: 'node-removed', nodeId: entry.id });
    }

    public resolveNodeId(target: object): string | undefined {
        const id = this.idsByTarget.get(target);
        return id && this.nodes.has(id) ? id : undefined;
    }

    public highlightDomNode(nodeOrId: AurumDevtoolsNodeReference, duration = 0): boolean {
        this.clearDomNodeHighlight();
        const entry = this.getEntry(nodeOrId);
        const target = entry === undefined ? undefined : this.dereference(entry);
        const element = target === undefined ? undefined : asDomElement(target);
        if (entry === undefined || element === undefined || !element.isConnected) return false;

        const document = element.ownerDocument;
        const host = document.documentElement;
        if (!host || typeof document.createElement !== 'function') return false;

        const overlay = document.createElement('div');
        overlay.setAttribute('data-aurum-devtools-highlight', entry.id);
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.cssText =
            'all:initial;position:fixed;display:block;pointer-events:none;box-sizing:border-box;' +
            'z-index:2147483647;background:rgba(66,133,244,.22);outline:2px solid rgba(66,133,244,.95);outline-offset:-1px;';

        const updateOverlay = (): void => {
            if (!element.isConnected) {
                this.clearDomNodeHighlight();
                return;
            }
            try {
                const bounds = element.getBoundingClientRect();
                overlay.style.left = `${bounds.left}px`;
                overlay.style.top = `${bounds.top}px`;
                overlay.style.width = `${Math.max(0, bounds.width)}px`;
                overlay.style.height = `${Math.max(0, bounds.height)}px`;
            } catch {
                this.clearDomNodeHighlight();
            }
        };

        const view = document.defaultView;
        const cleanup = once(() => {
            view?.removeEventListener('scroll', updateOverlay, true);
            view?.removeEventListener('resize', updateOverlay);
            overlay.remove();
            if (this.domHighlightCleanup === cleanup) {
                this.domHighlightCleanup = undefined;
                this.highlightedDomNodeId = undefined;
            }
        });
        this.highlightedDomNodeId = entry.id;
        this.domHighlightCleanup = cleanup;
        host.appendChild(overlay);
        view?.addEventListener('scroll', updateOverlay, true);
        view?.addEventListener('resize', updateOverlay);
        updateOverlay();
        if (Number.isFinite(duration) && duration > 0) {
            view?.setTimeout(cleanup, Math.min(10_000, duration));
        }
        return true;
    }

    public clearDomNodeHighlight(): void {
        this.domHighlightCleanup?.();
    }

    public linkNodes(
        source: AurumDevtoolsNodeReference,
        target: AurumDevtoolsNodeReference,
        descriptor: AurumDevtoolsEdgeDescriptor = {},
        cancellationToken?: AurumDevtoolsCancellation
    ): string | undefined {
        const sourceId = this.resolveReference(source);
        const targetId = this.resolveReference(target);
        if (!sourceId || !targetId) return undefined;

        const id = `aurum:edge:${++this.edgeSequence}`;
        const edge: DevtoolsEdgeEntry = {
            id,
            source: sourceId,
            target: targetId,
            kind: descriptor.kind ?? 'data-flow',
            label: this.resolvedConfig.mode === 'debug' ? descriptor.label : undefined,
            createdAt: Date.now(),
            metadata: this.resolvedConfig.mode === 'debug' ? previewRecord(descriptor.metadata, this.resolvedConfig) : undefined
        };
        this.edges.set(id, edge);
        this.addEdgeToNode(sourceId, id);
        this.addEdgeToNode(targetId, id);
        attachCancellation(cancellationToken, () => this.unlinkEdge(id));
        this.touch();
        this.publish({ type: 'edge-added', edgeId: id });
        return id;
    }

    public unlinkEdge(edgeOrId: AurumDevtoolsEdgeSnapshot | string): void {
        const id = typeof edgeOrId === 'string' ? edgeOrId : edgeOrId.id;
        const edge = this.edges.get(id);
        if (!edge || !this.edges.delete(id)) return;
        this.removeEdgeFromNode(edge.source, id);
        this.removeEdgeFromNode(edge.target, id);
        this.touch();
        this.publish({ type: 'edge-removed', edgeId: id });
    }

    public emitUpdate(targetOrId: AurumDevtoolsNodeReference, update: AurumDevtoolsUpdateDescriptor = {}): void {
        const entry = this.getEntry(targetOrId);
        if (!entry) return;
        entry.version++;
        this.touch();

        // Production exposes topology and counters but never walks or exports
        // closure-scoped values. Debug builds retain bounded previews.
        const safeUpdate = update && typeof update === 'object' ? update : {};
        const updateKindValue = safeReadProperty(safeUpdate, 'kind');
        const updateKind = typeof updateKindValue === 'string' ? updateKindValue : 'update';
        const debugConfig = this.resolvedConfig;
        if (debugConfig.mode !== 'debug') {
            this.publish({ type: 'node-updated', nodeId: entry.id, updateKind });
            return;
        }

        const hasValue = safeHasProperty(safeUpdate, 'value');
        if (this.resolvedConfig !== debugConfig) {
            this.publish({ type: 'node-updated', nodeId: entry.id, updateKind });
            return;
        }
        const rawValue = hasValue ? safeReadProperty(safeUpdate, 'value') : undefined;
        if (this.resolvedConfig !== debugConfig) {
            this.publish({ type: 'node-updated', nodeId: entry.id, updateKind });
            return;
        }
        const preview = hasValue ? previewValue(rawValue, debugConfig) : undefined;
        if (this.resolvedConfig !== debugConfig) {
            this.publish({ type: 'node-updated', nodeId: entry.id, updateKind });
            return;
        }
        const detailsValue = safeReadProperty(safeUpdate, 'details');
        if (this.resolvedConfig !== debugConfig) {
            this.publish({ type: 'node-updated', nodeId: entry.id, updateKind });
            return;
        }
        const details = detailsValue && typeof detailsValue === 'object' ? previewRecord(detailsValue as Record<string, unknown>, debugConfig) : undefined;

        // Preview getters may execute arbitrary application code, including a
        // re-entrant production reconfiguration. Never publish a preview that
        // was assembled across a configuration boundary.
        if (this.resolvedConfig !== debugConfig) {
            this.publish({ type: 'node-updated', nodeId: entry.id, updateKind });
            return;
        }
        if (hasValue) entry.lastValue = preview;
        this.publish({
            type: 'node-updated',
            nodeId: entry.id,
            updateKind,
            value: preview,
            details
        });
    }

    public setSubscriptionCount(targetOrId: AurumDevtoolsNodeReference, count: number, channel: string = 'updates'): void {
        const entry = this.getEntry(targetOrId);
        if (!entry) return;
        const normalized = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
        const rawChannel = typeof channel === 'string' ? channel : 'other';
        const previousCount = entry.subscriptionChannels.get(rawChannel) ?? 0;
        if (previousCount === normalized) return;
        if (normalized === 0) entry.subscriptionChannels.delete(rawChannel);
        else entry.subscriptionChannels.set(rawChannel, normalized);
        const exposedChannel = getExposedSubscriptionChannel(rawChannel, this.resolvedConfig.mode);
        const exposedCount = (entry.subscriptions[exposedChannel] ?? 0) + normalized - previousCount;
        if (entry.subscriptions[exposedChannel] === exposedCount) return;
        entry.subscriptions[exposedChannel] = exposedCount;
        this.touch();
        this.publish({ type: 'subscriptions-changed', nodeId: entry.id, channel: exposedChannel, count: exposedCount });
    }

    public annotateNode(targetOrId: AurumDevtoolsNodeReference, annotations: Record<string, unknown>): void {
        if (this.resolvedConfig.mode !== 'debug') return;
        const entry = this.getEntry(targetOrId);
        if (!entry) return;
        entry.metadata = { ...entry.metadata, ...previewRecord(annotations, this.resolvedConfig) };
        this.touch();
        this.publish({ type: 'node-updated', nodeId: entry.id, updateKind: 'annotation' });
    }

    public inspect(nodeOrId: AurumDevtoolsNodeReference): AurumDevtoolsNodeSnapshot | undefined {
        const entry = this.getEntry(nodeOrId);
        return entry ? this.toNodeSnapshot(entry) : undefined;
    }

    public getSnapshot(options: AurumDevtoolsSnapshotOptions = {}): AurumDevtoolsSnapshot {
        this.pruneCollectedNodes();
        const includeValues = options.includeValues !== false;
        return {
            runtimeId: this.runtimeId,
            revision: this.runtimeRevision,
            productionLocked: this.productionLocked,
            protocolVersion: AURUM_DEVTOOLS_PROTOCOL_VERSION,
            mode: this.resolvedConfig.mode,
            weakReferences: this.weakReferences,
            nodes: Array.from(this.nodes.values(), (entry) => this.toNodeSnapshot(entry, includeValues)),
            edges: Array.from(this.edges.values(), (edge) => {
                const { metadata: sourceMetadata, ...fields } = edge;
                const metadata = clonePreviewRecord(sourceMetadata);
                return { ...fields, ...(metadata === undefined ? {} : { metadata }) };
            }),
            events: this.events.map(cloneDevtoolsEvent)
        };
    }

    public subscribe(listener: AurumDevtoolsListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    public clearHistory(): void {
        if (this.events.length > 0) this.touch();
        this.events.length = 0;
    }

    private applyPatch(entry: DevtoolsNodeEntry, patch: AurumDevtoolsNodePatch<object>): void {
        if (patch.kind !== undefined) entry.kind = patch.kind;
        if (patch.name !== undefined && this.resolvedConfig.mode === 'debug') entry.name = patch.name;
        if (patch.getValue !== undefined && this.resolvedConfig.mode === 'debug') entry.getValue = patch.getValue;
        if (patch.metadata !== undefined && this.resolvedConfig.mode === 'debug') {
            entry.metadata = { ...entry.metadata, ...previewRecord(patch.metadata, this.resolvedConfig) };
        }
    }

    private getEntry(reference: AurumDevtoolsNodeReference): DevtoolsNodeEntry | undefined {
        const id = typeof reference === 'string' ? reference : this.resolveNodeId(reference);
        return id ? this.nodes.get(id) : undefined;
    }

    private resolveReference(reference: AurumDevtoolsNodeReference): string | undefined {
        return typeof reference === 'string' ? (this.nodes.has(reference) ? reference : undefined) : this.resolveNodeId(reference);
    }

    private dereference(entry: DevtoolsNodeEntry): object | undefined {
        return this.weakReferences ? (entry.target as WeakReferenceLike<object>).deref() : (entry.target as object);
    }

    private toNodeSnapshot(entry: DevtoolsNodeEntry, includeValue: boolean = true): AurumDevtoolsNodeSnapshot {
        const mayInspectValues = includeValue && this.resolvedConfig.mode === 'debug';
        let value = mayInspectValues ? entry.lastValue : undefined;
        const target = mayInspectValues ? this.dereference(entry) : undefined;
        if (includeValue && target && entry.getValue) {
            try {
                value = previewValue(entry.getValue(target), this.resolvedConfig);
            } catch (error) {
                value = previewThrown(error);
            }
        }
        const clonedValue = value ? cloneValuePreview(value) : undefined;
        const metadata = clonePreviewRecord(entry.metadata);
        return {
            id: entry.id,
            kind: entry.kind,
            ...(entry.name === undefined ? {} : { name: entry.name }),
            createdAt: entry.createdAt,
            version: entry.version,
            subscriptions: { ...entry.subscriptions },
            ...(clonedValue === undefined ? {} : { value: clonedValue }),
            ...(metadata === undefined ? {} : { metadata }),
            ...(entry.creationStack === undefined ? {} : { creationStack: entry.creationStack })
        };
    }

    private publish(event: Omit<AurumDevtoolsEvent, 'sequence' | 'timestamp'>): void {
        if (this.resolvedConfig.historyLimit === 0 && this.listeners.size === 0) return;
        const complete: AurumDevtoolsEvent = { ...event, sequence: ++this.eventSequence, timestamp: Date.now() };
        if (this.resolvedConfig.historyLimit > 0) {
            this.events.push(this.resolvedConfig.mode === 'debug' ? complete : redactDevtoolsEvent(complete));
            this.trimHistory();
        }
        for (const listener of Array.from(this.listeners)) {
            try {
                const exposed = this.resolvedConfig.mode === 'debug' ? complete : redactDevtoolsEvent(complete);
                listener(cloneDevtoolsEvent(exposed));
            } catch {
                // Inspection must never alter application behavior.
            }
        }
    }

    private trimHistory(): void {
        const excess = this.events.length - this.resolvedConfig.historyLimit;
        if (excess > 0) this.events.splice(0, excess);
    }

    private pruneCollectedNodes(): void {
        if (!this.weakReferences) return;
        for (const entry of Array.from(this.nodes.values())) {
            if (!this.dereference(entry)) this.removeCollectedNode(entry.id);
        }
    }

    private removeCollectedNode(id: string): void {
        const entry = this.nodes.get(id);
        if (entry) this.removeNode(entry);
    }

    private addEdgeToNode(nodeId: string, edgeId: string): void {
        let edges = this.edgeIdsByNode.get(nodeId);
        if (!edges) {
            edges = new Set();
            this.edgeIdsByNode.set(nodeId, edges);
        }
        edges.add(edgeId);
    }

    private removeEdgeFromNode(nodeId: string, edgeId: string): void {
        const edges = this.edgeIdsByNode.get(nodeId);
        if (!edges) return;
        edges.delete(edgeId);
        if (edges.size === 0) this.edgeIdsByNode.delete(nodeId);
    }

    private touch(): void {
        this.runtimeRevision++;
    }

    private trimFallbackNodes(): void {
        if (this.weakReferences) return;
        while (this.nodes.size > this.resolvedConfig.fallbackNodeLimit) {
            const oldest = this.nodes.values().next().value as DevtoolsNodeEntry | undefined;
            if (!oldest) return;
            this.removeNode(oldest);
        }
    }
}

function createAurumDevtoolsRegistryFacade(internal: DefaultAurumDevtoolsRegistry): AurumDevtoolsRegistry {
    const facade: AurumDevtoolsRegistry = {
        get runtimeId() {
            return internal.runtimeId;
        },
        get revision() {
            return internal.revision;
        },
        get productionLocked() {
            return internal.productionLocked;
        },
        get protocolVersion() {
            return internal.protocolVersion;
        },
        get mode() {
            return internal.mode;
        },
        get capabilities() {
            return internal.capabilities;
        },
        get config() {
            return internal.config;
        },
        get weakReferences() {
            return internal.weakReferences;
        },
        configure: (config) => internal.configure(sanitizeConfig(config)),
        registerNode: internal.registerNode.bind(internal) as AurumDevtoolsRegistry['registerNode'],
        updateNode: internal.updateNode.bind(internal) as AurumDevtoolsRegistry['updateNode'],
        unregisterNode: internal.unregisterNode.bind(internal),
        resolveNodeId: internal.resolveNodeId.bind(internal),
        linkNodes: internal.linkNodes.bind(internal),
        unlinkEdge: internal.unlinkEdge.bind(internal),
        emitUpdate: internal.emitUpdate.bind(internal),
        setSubscriptionCount: internal.setSubscriptionCount.bind(internal),
        annotateNode: internal.annotateNode.bind(internal),
        inspect: internal.inspect.bind(internal),
        highlightDomNode: internal.highlightDomNode.bind(internal),
        clearDomNodeHighlight: internal.clearDomNodeHighlight.bind(internal),
        getSnapshot: internal.getSnapshot.bind(internal),
        subscribe: internal.subscribe.bind(internal),
        clearHistory: internal.clearHistory.bind(internal)
    };
    return Object.freeze(facade);
}

export function getAurumDevtoolsRegistry(): AurumDevtoolsRegistry {
    // One module instance adopts an existing page registry only during its
    // first lookup. Afterwards it remains authoritative and re-exposes that
    // same registry if another script overwrites a discovery key. This keeps
    // exported helpers and extension discovery from diverging.
    if (cachedRegistry) {
        exposeRegistry(cachedRegistry);
        return cachedRegistry;
    }
    const fromSymbol = pageGlobalAvailable ? safeReadProperty(globalObject, AURUM_DEVTOOLS_SYMBOL) : undefined;
    const fromString = pageGlobalAvailable ? safeReadProperty(globalObject, AURUM_DEVTOOLS_GLOBAL_KEY) : undefined;
    const symbolRegistry = isAurumDevtoolsRegistry(fromSymbol) ? fromSymbol : undefined;
    const stringRegistry = isAurumDevtoolsRegistry(fromString) ? fromString : undefined;
    // A production-locked module must not hand raw registration descriptors or
    // targets to an unauthenticated object that was pre-seeded on the page.
    // Cross-copy adoption remains useful in debug builds, where inspection is
    // explicitly enabled, but the production boundary takes precedence here.
    const existing = compileTimeProductionLock ? undefined : [symbolRegistry, stringRegistry].find((candidate) => candidate !== undefined);
    if (existing) {
        cachedRegistry = existing;
        exposeRegistry(existing);
        return existing;
    }

    const configured = pageGlobalAvailable ? safeReadProperty(globalObject, AURUM_DEVTOOLS_CONFIG_GLOBAL_KEY) : undefined;
    localRegistry = new DefaultAurumDevtoolsRegistry({ ...compileTimeConfig, ...sanitizeConfig(configured) }, compileTimeProductionLock);
    const facade = createAurumDevtoolsRegistryFacade(localRegistry);
    cachedRegistry = facade;
    exposeRegistry(facade);
    return facade;
}

export function configureAurumDevtools(config: AurumDevtoolsConfig): AurumDevtoolsRegistry {
    instrumentationRegistry.configure(sanitizeConfig(config));
    return registry;
}

export function registerAurumDevtoolsNode<T extends object>(
    target: T,
    descriptor: AurumDevtoolsNodeDescriptor<T>,
    cancellationToken?: AurumDevtoolsCancellation
): string {
    if (!AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) return '';
    return instrumentationRegistry.registerNode(target, descriptor, cancellationToken);
}

export function updateAurumDevtoolsNode<T extends object>(targetOrId: T | string, patch: AurumDevtoolsNodePatch<T>): void {
    if (!AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) return;
    instrumentationRegistry.updateNode(targetOrId, patch);
}

export function unregisterAurumDevtoolsNode(targetOrId: AurumDevtoolsNodeReference): void {
    if (!AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) return;
    instrumentationRegistry.unregisterNode(targetOrId);
}

export function resolveAurumDevtoolsNodeId(target: object): string | undefined {
    if (!AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) return undefined;
    return instrumentationRegistry.resolveNodeId(target);
}

export function linkAurumDevtoolsNodes(
    source: AurumDevtoolsNodeReference,
    target: AurumDevtoolsNodeReference,
    descriptor?: AurumDevtoolsEdgeDescriptor,
    cancellationToken?: AurumDevtoolsCancellation
): string | undefined {
    if (!AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) return undefined;
    return instrumentationRegistry.linkNodes(source, target, descriptor, cancellationToken);
}

export function unlinkAurumDevtoolsEdge(edgeOrId: AurumDevtoolsEdgeSnapshot | string): void {
    if (!AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) return;
    instrumentationRegistry.unlinkEdge(edgeOrId);
}

export function emitAurumDevtoolsUpdate(targetOrId: AurumDevtoolsNodeReference, update?: AurumDevtoolsUpdateDescriptor): void {
    if (!AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) return;
    instrumentationRegistry.emitUpdate(targetOrId, update);
}

export function setAurumDevtoolsSubscriptionCount(targetOrId: AurumDevtoolsNodeReference, count: number, channel?: string): void {
    if (!AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) return;
    instrumentationRegistry.setSubscriptionCount(targetOrId, count, channel);
}

export function annotateAurumDevtoolsNode(targetOrId: AurumDevtoolsNodeReference, annotations: Record<string, unknown>): void {
    if (!AURUM_DEVTOOLS_INSTRUMENTATION_ENABLED) return;
    instrumentationRegistry.annotateNode(targetOrId, annotations);
}

export function previewAurumDevtoolsValue(
    value: unknown,
    config?: Pick<AurumDevtoolsConfig, 'previewDepth' | 'previewEntries' | 'previewNodeBudget'>
): AurumDevtoolsValuePreview {
    const registryConfig = instrumentationRegistry.config;
    return previewValue(value, {
        ...registryConfig,
        previewDepth: normalizePositiveInteger(config?.previewDepth, registryConfig.previewDepth),
        previewEntries: normalizePositiveInteger(config?.previewEntries, registryConfig.previewEntries),
        previewNodeBudget: normalizePositiveInteger(config?.previewNodeBudget, registryConfig.previewNodeBudget)
    });
}

function exposeRegistry(registry: AurumDevtoolsRegistry): void {
    // Callers only pass either the locally-created registry or one already
    // validated during first discovery. Avoid repeating reflective validation
    // when the cached registry is requested from a render hot path.
    if (!pageGlobalAvailable) return;
    try {
        if (safeReadProperty(globalObject, AURUM_DEVTOOLS_SYMBOL) !== registry) {
            Object.defineProperty(globalObject, AURUM_DEVTOOLS_SYMBOL, { configurable: true, value: registry });
        }
        if (safeReadProperty(globalObject, AURUM_DEVTOOLS_GLOBAL_KEY) !== registry) {
            Object.defineProperty(globalObject, AURUM_DEVTOOLS_GLOBAL_KEY, { configurable: true, value: registry });
        }
    } catch {
        // Frozen globals are unusual but should not prevent Aurum from running.
    }
}

export function isAurumDevtoolsRegistry(value: unknown): value is AurumDevtoolsRegistry {
    if (!value || typeof value !== 'object') return false;
    try {
        const candidate = value as object;
        const runtimeId = safeReadProperty(candidate, 'runtimeId');
        if (typeof runtimeId !== 'string' || runtimeId.length === 0 || runtimeId.length > 256) return false;
        if (!isFiniteNonNegativeNumber(safeReadProperty(candidate, 'revision'))) return false;
        if (typeof safeReadProperty(candidate, 'productionLocked') !== 'boolean') return false;
        if (safeReadProperty(candidate, 'protocolVersion') !== AURUM_DEVTOOLS_PROTOCOL_VERSION) return false;
        const mode = safeReadProperty(candidate, 'mode');
        if (mode !== 'debug' && mode !== 'production') return false;
        if (typeof safeReadProperty(candidate, 'weakReferences') !== 'boolean') return false;

        const capabilities = safeReadProperty(candidate, 'capabilities');
        if (!Array.isArray(capabilities) || !capabilities.every((capability) => typeof capability === 'string')) return false;
        const config = safeReadProperty(candidate, 'config');
        if (!isResolvedConfig(config) || config.mode !== mode) return false;

        const methods: Array<keyof AurumDevtoolsRegistry> = [
            'configure',
            'registerNode',
            'updateNode',
            'unregisterNode',
            'resolveNodeId',
            'linkNodes',
            'unlinkEdge',
            'emitUpdate',
            'setSubscriptionCount',
            'annotateNode',
            'inspect',
            'getSnapshot',
            'subscribe',
            'clearHistory'
        ];
        return methods.every((method) => typeof safeReadProperty(candidate, method) === 'function');
    } catch {
        return false;
    }
}

function isResolvedConfig(value: unknown): value is AurumDevtoolsResolvedConfig {
    if (!value || typeof value !== 'object') return false;
    const mode = safeReadProperty(value, 'mode');
    return (
        (mode === 'debug' || mode === 'production') &&
        typeof safeReadProperty(value, 'captureStacks') === 'boolean' &&
        isFiniteNonNegativeNumber(safeReadProperty(value, 'historyLimit')) &&
        isFiniteNonNegativeNumber(safeReadProperty(value, 'previewDepth')) &&
        isFinitePositiveNumber(safeReadProperty(value, 'previewEntries')) &&
        isFinitePositiveNumber(safeReadProperty(value, 'previewNodeBudget')) &&
        isFinitePositiveNumber(safeReadProperty(value, 'fallbackNodeLimit'))
    );
}

function sanitizeConfig(value: unknown): AurumDevtoolsConfig {
    if (!value || typeof value !== 'object') return {};
    const result: AurumDevtoolsConfig = {};
    const mode = safeReadProperty(value, 'mode');
    const captureStacks = safeReadProperty(value, 'captureStacks');
    if (mode === 'debug' || mode === 'production') result.mode = mode;
    if (typeof captureStacks === 'boolean') result.captureStacks = captureStacks;
    copyFiniteConfigNumber(value, result, 'historyLimit');
    copyFiniteConfigNumber(value, result, 'previewDepth');
    copyFiniteConfigNumber(value, result, 'previewEntries');
    copyFiniteConfigNumber(value, result, 'previewNodeBudget');
    copyFiniteConfigNumber(value, result, 'fallbackNodeLimit');
    return result;
}

type NumericDevtoolsConfigKey = 'historyLimit' | 'previewDepth' | 'previewEntries' | 'previewNodeBudget' | 'fallbackNodeLimit';

function copyFiniteConfigNumber(source: object, target: AurumDevtoolsConfig, key: NumericDevtoolsConfigKey): void {
    const value = safeReadProperty(source, key);
    if (typeof value === 'number' && Number.isFinite(value)) target[key] = value;
}

function safeReadProperty(target: object, key: PropertyKey): unknown {
    try {
        return (target as Record<PropertyKey, unknown>)[key];
    } catch {
        return undefined;
    }
}

function safeHasProperty(target: object, key: PropertyKey): boolean {
    try {
        return key in target;
    } catch {
        return false;
    }
}

function asDomElement(target: object): Element | undefined {
    try {
        const candidate = target as Partial<Element>;
        const document = candidate.ownerDocument;
        if (
            candidate.nodeType !== 1 ||
            document === null ||
            document === undefined ||
            typeof candidate.getBoundingClientRect !== 'function'
        ) {
            return undefined;
        }
        const elementConstructor = document.defaultView?.Element;
        return elementConstructor === undefined || target instanceof elementConstructor ? (target as Element) : undefined;
    } catch {
        return undefined;
    }
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isFinitePositiveNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

const productionSubscriptionChannels = new Set(['updates', 'errors', 'upstream', 'downstream', 'items-added', 'items-removed']);

function getExposedSubscriptionChannel(channel: string, mode: AurumDevtoolsMode): string {
    if (mode === 'debug') return channel;
    if (channel.startsWith('key:')) return 'keys';
    return productionSubscriptionChannels.has(channel) ? channel : 'other';
}

function projectSubscriptionCounts(channels: Map<string, number>, mode: AurumDevtoolsMode): Record<string, number> {
    const result = createSubscriptionCountRecord();
    for (const [channel, count] of channels) {
        const bucket = getExposedSubscriptionChannel(channel, mode);
        result[bucket] = (result[bucket] ?? 0) + count;
    }
    return result;
}

function createSubscriptionCountRecord(): Record<string, number> {
    return Object.create(null) as Record<string, number>;
}

function cloneDevtoolsEvent(event: AurumDevtoolsEvent): AurumDevtoolsEvent {
    const { value: sourceValue, details: sourceDetails, ...fields } = event;
    const value = sourceValue ? cloneValuePreview(sourceValue) : undefined;
    const details = clonePreviewRecord(sourceDetails);
    return {
        ...fields,
        ...(value === undefined ? {} : { value }),
        ...(details === undefined ? {} : { details })
    };
}

function redactDevtoolsEvent(event: AurumDevtoolsEvent): AurumDevtoolsEvent {
    const { value: _value, details: _details, ...redacted } = event;
    return redacted;
}

function clonePreviewRecord(
    record: Readonly<Record<string, AurumDevtoolsValuePreview>> | undefined
): Record<string, AurumDevtoolsValuePreview> | undefined {
    if (!record) return undefined;
    const result: Record<string, AurumDevtoolsValuePreview> = Object.create(null) as Record<string, AurumDevtoolsValuePreview>;
    for (const key of Object.keys(record)) result[key] = cloneValuePreview(record[key]);
    return result;
}

function cloneValuePreview(preview: AurumDevtoolsValuePreview): AurumDevtoolsValuePreview {
    return {
        ...preview,
        entries: preview.entries?.map((entry) => ({ ...entry, value: cloneValuePreview(entry.value) }))
    };
}

function readCompileTimeConfig(): AurumDevtoolsConfig {
    const result: AurumDevtoolsConfig = {};
    if (typeof __AURUM_DEVTOOLS_MODE__ !== 'undefined' && (__AURUM_DEVTOOLS_MODE__ === 'debug' || __AURUM_DEVTOOLS_MODE__ === 'production')) {
        result.mode = __AURUM_DEVTOOLS_MODE__;
    }
    if (typeof __AURUM_DEVTOOLS_CAPTURE_STACKS__ !== 'undefined' && typeof __AURUM_DEVTOOLS_CAPTURE_STACKS__ === 'boolean') {
        result.captureStacks = __AURUM_DEVTOOLS_CAPTURE_STACKS__;
    }
    if (typeof __AURUM_DEVTOOLS_HISTORY_LIMIT__ !== 'undefined' && typeof __AURUM_DEVTOOLS_HISTORY_LIMIT__ === 'number') {
        result.historyLimit = __AURUM_DEVTOOLS_HISTORY_LIMIT__;
    }
    return result;
}

function resolveConfig(
    config: AurumDevtoolsConfig,
    previous?: AurumDevtoolsResolvedConfig,
    productionLocked: boolean = false
): AurumDevtoolsResolvedConfig {
    const mode = productionLocked ? 'production' : config.mode ?? previous?.mode ?? 'production';
    const modeChanged = previous !== undefined && config.mode !== undefined && config.mode !== previous.mode;
    return Object.freeze({
        mode,
        captureStacks:
            mode === 'production' ? false : config.captureStacks ?? (previous && config.mode === undefined ? previous.captureStacks : true),
        historyLimit: productionLocked
            ? 0
            : normalizeNonNegativeInteger(config.historyLimit, !modeChanged && previous ? previous.historyLimit : mode === 'debug' ? 200 : 0),
        previewDepth: normalizeNonNegativeInteger(config.previewDepth, !modeChanged && previous ? previous.previewDepth : mode === 'debug' ? 3 : 1),
        previewEntries: normalizePositiveInteger(config.previewEntries, !modeChanged && previous ? previous.previewEntries : mode === 'debug' ? 20 : 8),
        previewNodeBudget: normalizePositiveInteger(
            config.previewNodeBudget,
            !modeChanged && previous ? previous.previewNodeBudget : mode === 'debug' ? 250 : 50
        ),
        fallbackNodeLimit: normalizePositiveInteger(
            config.fallbackNodeLimit,
            !modeChanged && previous ? previous.fallbackNodeLimit : mode === 'debug' ? 5000 : 500
        )
    });
}

function normalizeNonNegativeInteger(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function attachCancellation(cancellationToken: AurumDevtoolsCancellation | undefined, callback: () => void): void {
    if (!cancellationToken) return;
    if (cancellationToken.isCancelled) {
        callback();
        return;
    }
    cancellationToken.addCancellable(callback);
}

function once(callback: () => void): () => void {
    let active = true;
    return () => {
        if (!active) return;
        active = false;
        callback();
    };
}

let runtimeIdFallbackSequence = 0;

function createRuntimeId(): string {
    try {
        const cryptoApi = safeReadProperty(globalThis as unknown as object, 'crypto') as
            | { randomUUID?: () => string; getRandomValues?: (values: Uint32Array) => Uint32Array }
            | undefined;
        if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return `aurum:${cryptoApi.randomUUID.call(cryptoApi)}`;
        if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
            const values = cryptoApi.getRandomValues.call(cryptoApi, new Uint32Array(4));
            const parts: string[] = [];
            for (let index = 0; index < values.length; index++) parts.push(values[index].toString(36));
            return `aurum:${parts.join('-')}`;
        }
    } catch {
        // Fall through to a dependency-free identifier.
    }
    runtimeIdFallbackSequence++;
    let random = '0';
    try {
        random = Math.random().toString(36).slice(2);
    } catch {}
    return `aurum:${Date.now().toString(36)}:${runtimeIdFallbackSequence.toString(36)}:${random}`;
}

function assertTarget(target: object): void {
    if ((typeof target !== 'object' && typeof target !== 'function') || target === null) {
        throw new TypeError('Aurum devtools nodes must be registered with an object target');
    }
}

function captureCreationStack(): string | undefined {
    try {
        const stack = new Error().stack;
        if (!stack) return undefined;
        return stack
            .split('\n')
            .filter((line) => !line.includes('captureCreationStack') && !line.includes('registerAurumDevtoolsNode'))
            .slice(1, 16)
            .join('\n')
            .slice(0, 6000);
    } catch {
        return undefined;
    }
}

function previewRecord(
    record: Record<string, unknown> | undefined,
    config: AurumDevtoolsResolvedConfig
): Record<string, AurumDevtoolsValuePreview> | undefined {
    if (!record) return undefined;
    const result: Record<string, AurumDevtoolsValuePreview> = Object.create(null) as Record<string, AurumDevtoolsValuePreview>;
    const budget: PreviewBudget = { remaining: config.previewNodeBudget };
    let keys: string[];
    try {
        keys = Object.keys(record).slice(0, config.previewEntries);
    } catch (error) {
        return { '<error>': previewThrown(error) };
    }
    for (const key of keys) {
        if (budget.remaining <= 0) break;
        try {
            result[key] = previewValueInternal(record[key], config, 0, new Set<object>(), budget);
        } catch (error) {
            result[key] = previewThrownWithBudget(error, budget);
        }
    }
    return result;
}

function previewValue(value: unknown, config: AurumDevtoolsResolvedConfig): AurumDevtoolsValuePreview {
    return previewValueInternal(value, config, 0, new Set<object>(), { remaining: config.previewNodeBudget });
}

interface PreviewBudget {
    remaining: number;
}

function previewValueInternal(
    value: unknown,
    config: AurumDevtoolsResolvedConfig,
    depth: number,
    ancestors: Set<object>,
    budget: PreviewBudget
): AurumDevtoolsValuePreview {
    if (!consumePreviewNode(budget)) return previewBudgetExhausted();
    if (value === null) return { type: 'null', summary: 'null', value: null };
    switch (typeof value) {
        case 'undefined':
            return { type: 'undefined', summary: 'undefined' };
        case 'string': {
            const truncated = value.length > 200;
            const display = truncated ? `${value.slice(0, 197)}...` : value;
            return { type: 'string', summary: JSON.stringify(display), value: display, truncated: truncated || undefined };
        }
        case 'number':
            return { type: 'number', summary: String(value), value: Number.isFinite(value) ? value : String(value) };
        case 'boolean':
            return { type: 'boolean', summary: String(value), value };
        case 'bigint': {
            let summary = '<bigint>';
            try {
                summary = `${value.toString()}n`;
            } catch {}
            return { type: 'bigint', summary };
        }
        case 'symbol': {
            let summary = 'Symbol()';
            try {
                summary = String(value);
            } catch {}
            return { type: 'symbol', summary };
        }
        case 'function':
            return { type: 'function', summary: safeFunctionSummary(value as Function) };
    }

    const objectValue = value as object;
    if (ancestors.has(objectValue)) return { type: 'circular', summary: '[Circular]' };
    const type = safeObjectType(objectValue);
    if (depth >= config.previewDepth) return { type, summary: safeObjectSummary(objectValue, type), truncated: true };

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(objectValue);
    if (isArray(objectValue)) {
        const arrayValue = objectValue as unknown[];
        const entries: Array<{ key?: string; value: AurumDevtoolsValuePreview }> = [];
        const length = safeLength(arrayValue);
        for (let index = 0; index < Math.min(length, config.previewEntries); index++) {
            if (budget.remaining <= 0) break;
            try {
                entries.push({ key: String(index), value: previewValueInternal(arrayValue[index], config, depth + 1, nextAncestors, budget) });
            } catch (error) {
                entries.push({ key: String(index), value: previewThrownWithBudget(error, budget) });
            }
        }
        return {
            type: 'array',
            summary: `Array(${length})`,
            size: length,
            entries,
            truncated: length > entries.length || budget.remaining <= 0 || undefined
        };
    }

    if (isMap(objectValue)) return previewIterable(objectValue, 'map', config, depth, nextAncestors, budget);
    if (isSet(objectValue)) return previewIterable(objectValue, 'set', config, depth, nextAncestors, budget);

    let keys: string[];
    try {
        keys = Object.keys(objectValue);
    } catch (error) {
        return { type, summary: `${safeObjectSummary(objectValue, type)} <uninspectable: ${safeErrorMessage(error)}>` };
    }
    const entries: Array<{ key?: string; value: AurumDevtoolsValuePreview }> = [];
    for (const key of keys.slice(0, config.previewEntries)) {
        if (budget.remaining <= 0) break;
        try {
            entries.push({
                key,
                value: previewValueInternal((objectValue as Record<string, unknown>)[key], config, depth + 1, nextAncestors, budget)
            });
        } catch (error) {
            entries.push({ key, value: previewThrownWithBudget(error, budget) });
        }
    }
    return {
        type,
        summary: safeObjectSummary(objectValue, type),
        size: keys.length,
        entries,
        truncated: keys.length > entries.length || budget.remaining <= 0 || undefined
    };
}

function previewIterable(
    value: Map<unknown, unknown> | Set<unknown>,
    type: 'map' | 'set',
    config: AurumDevtoolsResolvedConfig,
    depth: number,
    ancestors: Set<object>,
    budget: PreviewBudget
): AurumDevtoolsValuePreview {
    const entries: Array<{ key?: string; value: AurumDevtoolsValuePreview }> = [];
    try {
        if (type === 'map') {
            let index = 0;
            for (const [key, item] of value as Map<unknown, unknown>) {
                if (index++ >= config.previewEntries || budget.remaining <= 0) break;
                entries.push({ key: previewKey(key), value: previewValueInternal(item, config, depth + 1, ancestors, budget) });
            }
        } else {
            let index = 0;
            for (const item of value as Set<unknown>) {
                if (index++ >= config.previewEntries || budget.remaining <= 0) break;
                entries.push({ value: previewValueInternal(item, config, depth + 1, ancestors, budget) });
            }
        }
    } catch (error) {
        if (budget.remaining > 0) entries.push({ key: '<error>', value: previewThrownWithBudget(error, budget) });
    }
    let size = 0;
    try {
        size = value.size;
    } catch {}
    return {
        type,
        summary: `${type === 'map' ? 'Map' : 'Set'}(${size})`,
        size,
        entries,
        truncated: size > entries.length || budget.remaining <= 0 || undefined
    };
}

function safeLength(value: unknown[]): number {
    try {
        return value.length;
    } catch {
        return 0;
    }
}

function isArray(value: object): boolean {
    try {
        return Array.isArray(value);
    } catch {
        return false;
    }
}

function safeObjectType(value: object): string {
    try {
        const name = (value as { constructor?: { name?: unknown } }).constructor?.name;
        return typeof name === 'string' && name ? name : 'object';
    } catch {
        return 'object';
    }
}

function safeObjectSummary(value: object, type: string): string {
    try {
        if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
        if (value instanceof RegExp) return value.toString();
        if (value instanceof Error) return `${value.name}: ${value.message}`.slice(0, 300);
    } catch {}
    return type === 'object' ? '{…}' : `${type} {…}`;
}

function safeFunctionSummary(value: Function): string {
    try {
        return value.name ? `[Function ${value.name}]` : '[Function]';
    } catch {
        return '[Function]';
    }
}

function isMap(value: object): value is Map<unknown, unknown> {
    try {
        return value instanceof Map;
    } catch {
        return false;
    }
}

function isSet(value: object): value is Set<unknown> {
    try {
        return value instanceof Set;
    } catch {
        return false;
    }
}

function previewKey(value: unknown): string {
    if (typeof value === 'string') return value.slice(0, 100);
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'function') return safeFunctionSummary(value as Function);
    if (typeof value === 'symbol') {
        try {
            return String(value);
        } catch {
            return 'Symbol()';
        }
    }
    const objectValue = value as object;
    return safeObjectSummary(objectValue, safeObjectType(objectValue));
}

function consumePreviewNode(budget: PreviewBudget): boolean {
    if (budget.remaining <= 0) return false;
    budget.remaining--;
    return true;
}

function previewBudgetExhausted(): AurumDevtoolsValuePreview {
    return { type: 'truncated', summary: '…', truncated: true };
}

function previewThrownWithBudget(error: unknown, budget: PreviewBudget): AurumDevtoolsValuePreview {
    return consumePreviewNode(budget) ? previewThrown(error) : previewBudgetExhausted();
}

function previewThrown(error: unknown): AurumDevtoolsValuePreview {
    return { type: 'error', summary: `<threw: ${safeErrorMessage(error)}>` };
}

function safeErrorMessage(error: unknown): string {
    try {
        if (error instanceof Error) return error.message.slice(0, 200);
        return String(error).slice(0, 200);
    } catch {
        return 'unknown error';
    }
}

const registry = getAurumDevtoolsRegistry();
const instrumentationRegistry: AurumDevtoolsRegistry = localRegistry ?? registry;

/** The page-global registry, exported for consumers that prefer direct access. */
export const aurumDevtools = registry;
