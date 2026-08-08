export const SUPPORTED_PROTOCOL_VERSION = 1;

export type RuntimeMode = 'debug' | 'production' | 'unknown';

export interface DevtoolsNode {
    id: string;
    kind: string;
    name?: string;
    value: unknown;
    version?: number;
    subscriberCount: number;
    subscriptions: Record<string, number>;
    upstream: string[];
    downstream: string[];
    stack?: string;
    annotations?: unknown;
    createdAt?: number | string;
    details?: unknown;
    breakOnUpdate?: boolean;
}

export interface DevtoolsEdge {
    id?: string;
    source: string;
    target: string;
    kind?: string;
    label?: string;
    createdAt?: number;
    metadata?: unknown;
}

export interface DevtoolsEvent {
    id: string;
    sequence?: number;
    timestamp: number;
    type: string;
    nodeId?: string;
    sourceId?: string;
    targetId?: string;
    edgeId?: string;
    updateKind?: string;
    channel?: string;
    count?: number;
    value?: unknown;
    details?: unknown;
}

export interface DevtoolsSnapshot {
    protocolVersion: number;
    runtimeId?: string;
    revision?: string | number;
    mode: RuntimeMode;
    timestamp: number;
    nodes: DevtoolsNode[];
    edges: DevtoolsEdge[];
    recentEvents: DevtoolsEvent[];
    weakReferences?: boolean;
}

export interface RuntimeStatus {
    available: boolean;
    runtimeId?: string;
    bridgeMode?: 'shared' | 'snapshot-only';
    protocolVersion?: number;
    mode: RuntimeMode;
    capabilities: string[];
    error?: string;
    droppedEvents: number;
}

export interface PagePollResult extends RuntimeStatus {
    snapshot?: unknown;
    events?: unknown[];
    unchanged?: boolean;
}

export function normalizeMode(value: unknown): RuntimeMode {
    if (value === 'debug' || value === 'development') {
        return 'debug';
    }

    if (value === 'production' || value === 'prod') {
        return 'production';
    }

    return 'unknown';
}

export function normalizeSnapshot(raw: unknown, status?: Partial<RuntimeStatus>): DevtoolsSnapshot {
    const source = asRecord(raw);
    const rawNodes = normalizeCollection(source?.nodes ?? source?.sources);
    const nodes = rawNodes.map((node, index) => normalizeNode(node, index));
    const rawEdges = normalizeCollection(source?.edges ?? source?.connections);
    const edges = deduplicateEdges([
        ...rawEdges.map(normalizeEdge).filter((edge): edge is DevtoolsEdge => edge !== undefined),
        ...inferEdges(nodes)
    ]);
    const protocolVersion = finiteNumber(source?.protocolVersion ?? source?.version ?? status?.protocolVersion) ?? 0;
    const timestamp = finiteNumber(source?.timestamp ?? source?.capturedAt) ?? Date.now();
    const mode = normalizeMode(source?.mode ?? status?.mode);
    const eventSource = normalizeCollection(source?.recentEvents ?? source?.events);
    const weakReferences = typeof source?.weakReferences === 'boolean' ? source.weakReferences : undefined;
    const runtimeId = identifier(source?.runtimeId);
    const revision = normalizeRevision(source?.revision ?? source?.snapshotRevision);

    return {
        protocolVersion,
        ...(runtimeId === undefined ? {} : { runtimeId }),
        ...(revision === undefined ? {} : { revision }),
        mode,
        timestamp,
        nodes,
        edges,
        recentEvents: eventSource.map((event, index) => normalizeEvent(event, index, timestamp)),
        ...(weakReferences === undefined ? {} : { weakReferences })
    };
}

export function normalizeEvents(rawEvents: unknown, timestamp = Date.now()): DevtoolsEvent[] {
    return normalizeCollection(rawEvents).map((event, index) => normalizeEvent(event, index, timestamp));
}

export function normalizeNode(raw: unknown, index = 0): DevtoolsNode {
    const source = asRecord(raw) ?? {};
    const id = identifier(source.id ?? source.nodeId ?? source.sourceId) ?? `unknown-${index}`;
    const subscribers = source.subscriberCount ?? source.subscriptionCount ?? source.subscribers ?? source.subscriptions;
    const subscriptions = normalizeSubscriptions(source.subscriptions);
    const name = nonEmptyString(source.name ?? source.debugName ?? source.label);
    const stack = nonEmptyString(source.stack ?? source.creationStack ?? source.createdAtStack);
    const breakOnUpdate = source.breakOnUpdate === true;

    return {
        id,
        kind: nonEmptyString(source.kind ?? source.type ?? source.constructorName) ?? 'source',
        ...(name === undefined ? {} : { name }),
        value: valueField(source),
        ...(finiteNumber(source.version ?? source.revision) === undefined
            ? {}
            : { version: finiteNumber(source.version ?? source.revision) }),
        subscriberCount: typeof subscribers === 'number' ? collectionCount(subscribers) : subscriptionTotal(subscriptions, subscribers),
        subscriptions,
        upstream: identifierArray(source.upstream ?? source.inputs ?? source.dependencies ?? source.parents),
        downstream: identifierArray(source.downstream ?? source.outputs ?? source.dependents ?? source.children),
        ...(stack === undefined ? {} : { stack }),
        ...(breakOnUpdate ? { breakOnUpdate: true } : {}),
        ...(!('annotations' in source || 'metadata' in source) ? {} : { annotations: source.annotations ?? source.metadata }),
        ...(!('createdAt' in source) ? {} : { createdAt: normalizeCreatedAt(source.createdAt) }),
        ...(!('details' in source || 'metadata' in source) ? {} : { details: source.details ?? source.metadata })
    };
}

export function normalizeEvent(raw: unknown, index = 0, fallbackTimestamp = Date.now()): DevtoolsEvent {
    const source = asRecord(raw) ?? {};
    const sequence = finiteNumber(source.sequence ?? source.seq);
    const timestamp = finiteNumber(source.timestamp ?? source.time) ?? fallbackTimestamp;
    const type = nonEmptyString(source.type ?? source.kind ?? source.event) ?? 'update';
    const nodeId = identifier(source.nodeId ?? source.node ?? source.idOfNode);
    const sourceId = identifier(source.sourceId ?? source.source ?? source.from);
    const targetId = identifier(source.targetId ?? source.target ?? source.to);
    const edgeId = identifier(source.edgeId);
    const updateKind = nonEmptyString(source.updateKind);
    const channel = nonEmptyString(source.channel);
    const count = finiteNumber(source.count);
    const explicitId = identifier(source.id ?? source.eventId);

    return {
        id: explicitId ?? (sequence === undefined ? `${timestamp}-${index}-${type}` : `sequence-${sequence}`),
        ...(sequence === undefined ? {} : { sequence }),
        timestamp,
        type,
        ...(nodeId === undefined ? {} : { nodeId }),
        ...(sourceId === undefined ? {} : { sourceId }),
        ...(targetId === undefined ? {} : { targetId }),
        ...(edgeId === undefined ? {} : { edgeId }),
        ...(updateKind === undefined ? {} : { updateKind }),
        ...(channel === undefined ? {} : { channel }),
        ...(count === undefined ? {} : { count }),
        ...(!('value' in source || 'valuePreview' in source) ? {} : { value: source.value ?? source.valuePreview }),
        ...(!('details' in source || 'metadata' in source) ? {} : { details: source.details ?? source.metadata })
    };
}

function valueField(source: Record<string, unknown>): unknown {
    if ('value' in source) {
        return source.value;
    }

    if ('valuePreview' in source) {
        return source.valuePreview;
    }

    return source.currentValue;
}

function normalizeEdge(raw: unknown): DevtoolsEdge | undefined {
    const source = asRecord(raw);

    if (source === undefined) {
        return undefined;
    }

    const from = identifier(source.source ?? source.sourceId ?? source.from ?? source.upstream);
    const to = identifier(source.target ?? source.targetId ?? source.to ?? source.downstream);

    if (from === undefined || to === undefined) {
        return undefined;
    }

    const kind = nonEmptyString(source.kind ?? source.type);
    const id = identifier(source.id ?? source.edgeId);
    const label = nonEmptyString(source.label);
    const createdAt = finiteNumber(source.createdAt);
    return {
        source: from,
        target: to,
        ...(id === undefined ? {} : { id }),
        ...(kind === undefined ? {} : { kind }),
        ...(label === undefined ? {} : { label }),
        ...(createdAt === undefined ? {} : { createdAt }),
        ...(!('metadata' in source) ? {} : { metadata: source.metadata })
    };
}

function inferEdges(nodes: DevtoolsNode[]): DevtoolsEdge[] {
    const edges: DevtoolsEdge[] = [];

    for (const node of nodes) {
        for (const source of node.upstream) {
            edges.push({ source, target: node.id });
        }

        for (const target of node.downstream) {
            edges.push({ source: node.id, target });
        }
    }

    return edges;
}

function deduplicateEdges(edges: DevtoolsEdge[]): DevtoolsEdge[] {
    const explicitRelationshipKeys = new Set(
        edges.filter((edge) => edge.id !== undefined).map((edge) => relationshipKey(edge))
    );
    const seenIds = new Set<string>();
    const seenInferredRelationships = new Set<string>();
    const result: DevtoolsEdge[] = [];

    for (const edge of edges) {
        if (edge.id !== undefined) {
            if (!seenIds.has(edge.id)) {
                seenIds.add(edge.id);
                result.push(edge);
            }
            continue;
        }

        const relationship = relationshipKey(edge);
        if (!explicitRelationshipKeys.has(relationship) && !seenInferredRelationships.has(relationship)) {
            seenInferredRelationships.add(relationship);
            result.push(edge);
        }
    }

    return result;
}

function relationshipKey(edge: DevtoolsEdge): string {
    return `${edge.source}\u0000${edge.target}\u0000${edge.kind ?? ''}\u0000${edge.label ?? ''}`;
}

function identifierArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const result: string[] = [];
    for (const item of value) {
        const record = asRecord(item);
        const id = identifier(record?.id ?? record?.nodeId ?? record?.sourceId ?? record?.targetId ?? item);
        if (id !== undefined) {
            result.push(id);
        }
    }

    return result;
}

function normalizeCollection(value: unknown): unknown[] {
    if (Array.isArray(value)) {
        return value;
    }

    const record = asRecord(value);
    return record === undefined ? [] : Object.values(record);
}

function collectionCount(value: unknown): number {
    const count = finiteNumber(value);
    if (count !== undefined) {
        return count;
    }

    if (Array.isArray(value)) {
        return value.length;
    }

    const record = asRecord(value);
    return record === undefined ? 0 : Object.keys(record).length;
}

function normalizeSubscriptions(value: unknown): Record<string, number> {
    const source = asRecord(value);
    const subscriptions: Record<string, number> = {};

    if (source === undefined) {
        return subscriptions;
    }

    for (const [channel, rawCount] of Object.entries(source)) {
        const count = finiteNumber(rawCount);
        if (count !== undefined) {
            subscriptions[channel] = count;
        }
    }

    return subscriptions;
}

function subscriptionTotal(subscriptions: Record<string, number>, fallback: unknown): number {
    const values = Object.values(subscriptions);
    return values.length === 0 ? collectionCount(fallback) : values.reduce((total, count) => total + count, 0);
}

function identifier(value: unknown): string | undefined {
    if (typeof value === 'string' && value.length > 0) {
        return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    return undefined;
}

function nonEmptyString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeRevision(value: unknown): string | number | undefined {
    if (typeof value === 'string') {
        return value;
    }
    return finiteNumber(value);
}

function normalizeCreatedAt(value: unknown): number | string {
    return typeof value === 'number' || typeof value === 'string' ? value : String(value);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;
}
