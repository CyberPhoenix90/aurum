import type { DevtoolsEdge, DevtoolsEvent, DevtoolsNode, DevtoolsSnapshot, RuntimeStatus } from './protocol.js';

export interface PositionedNode {
    node: DevtoolsNode;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface GraphLayout {
    nodes: PositionedNode[];
    edges: DevtoolsEdge[];
    width: number;
    height: number;
}

export interface PageSlice<Item> {
    items: Item[];
    page: number;
    pageCount: number;
    start: number;
    end: number;
    total: number;
}

export function mergeEvents(previous: DevtoolsEvent[], incoming: DevtoolsEvent[], limit = 1000): DevtoolsEvent[] {
    const seen = new Set<string>();
    const merged: DevtoolsEvent[] = [];

    for (const event of [...previous, ...incoming]) {
        if (!seen.has(event.id)) {
            seen.add(event.id);
            merged.push(event);
        }
    }

    return merged.length <= limit ? merged : merged.slice(merged.length - limit);
}

export function filterNodes(nodes: DevtoolsNode[], query: string, kind: string): DevtoolsNode[] {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return nodes.filter((node) => {
        if (kind !== '' && node.kind !== kind) {
            return false;
        }

        if (normalizedQuery === '') {
            return true;
        }

        const searchable = `${node.name ?? ''}\n${node.kind}\n${node.id}`.toLocaleLowerCase();
        return searchable.includes(normalizedQuery);
    });
}

export function paginateItems<Item>(items: Item[], requestedPage: number, pageSize: number): PageSlice<Item> {
    const normalizedPageSize = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 1;
    const pageCount = Math.max(1, Math.ceil(items.length / normalizedPageSize));
    const normalizedPage = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 0;
    const page = Math.min(Math.max(0, normalizedPage), pageCount - 1);
    const start = page * normalizedPageSize;
    const end = Math.min(items.length, start + normalizedPageSize);
    return { items: items.slice(start, end), page, pageCount, start, end, total: items.length };
}

export function shouldPollPanel(live: boolean, visible: boolean, documentHidden: boolean, disposed: boolean): boolean {
    return live && visible && !documentHidden && !disposed;
}

export function shouldRefreshInspection(
    force: boolean,
    previous: Pick<DevtoolsNode, 'id' | 'version'> | undefined,
    current: Pick<DevtoolsNode, 'id' | 'version'> | undefined,
    selectedNodeLegacyEvent: boolean
): boolean {
    return (
        force ||
        selectedNodeLegacyEvent ||
        (previous !== undefined && current !== undefined && previous.id === current.id && previous.version !== current.version)
    );
}

export function createPanelRevision(snapshot: DevtoolsSnapshot, events: DevtoolsEvent[], status: RuntimeStatus): string {
    let hash = 2166136261;
    const add = (value: unknown): void => {
        const text = String(value ?? '');
        for (let index = 0; index < text.length; index++) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
    };

    add(status.available);
    add(status.runtimeId);
    add(status.protocolVersion);
    add(status.mode);
    add(status.bridgeMode);
    add(status.error);
    add(status.droppedEvents);
    add(status.capabilities.join(','));
    add(snapshot.revision);
    add(snapshot.weakReferences);
    add(snapshot.nodes.length);
    add(snapshot.edges.length);

    // A native runtime revision makes this check O(1) in graph size. Foreign
    // and older v1 registries still get a complete structural fallback.
    if (snapshot.revision === undefined) {
        for (const node of snapshot.nodes) {
            add(node.id);
            add(node.kind);
            add(node.name);
            add(node.version);
            add(node.subscriberCount);
            add(compactValue(node.value));
            for (const channel of Object.keys(node.subscriptions).sort()) {
                add(channel);
                add(node.subscriptions[channel]);
            }
        }
        for (const edge of snapshot.edges) {
            add(edge.id);
            add(edge.source);
            add(edge.target);
            add(edge.kind);
            add(edge.label);
        }
    }
    add(events.length);
    const latestEvent = events[events.length - 1];
    if (latestEvent !== undefined) {
        add(latestEvent.id);
        add(latestEvent.sequence);
        add(latestEvent.type);
    }

    return (hash >>> 0).toString(36);
}

export function compactValue(value: unknown, maximumLength = 120): string {
    let text: string;

    if (hasSummary(value)) {
        text = value.summary;
    } else if (typeof value === 'string') {
        text = value;
    } else if (value === undefined) {
        text = 'undefined';
    } else {
        try {
            text = JSON.stringify(value);
        } catch {
            text = String(value);
        }
    }

    if (text === undefined) {
        text = String(value);
    }

    return text.length <= maximumLength ? text : `${text.slice(0, Math.max(0, maximumLength - 1))}…`;
}

function hasSummary(value: unknown): value is { summary: string } {
    return typeof value === 'object' && value !== null && 'summary' in value && typeof (value as { summary?: unknown }).summary === 'string';
}

export function detailedValue(value: unknown): string {
    if (value === undefined) {
        return 'undefined';
    }

    if (typeof value === 'string') {
        return value;
    }

    try {
        return JSON.stringify(value, undefined, 2) ?? String(value);
    } catch {
        return String(value);
    }
}

export function layoutGraph(nodes: DevtoolsNode[], edges: DevtoolsEdge[]): GraphLayout {
    const nodeIds = new Set(nodes.map((node) => node.id));
    const graphEdges = edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
    const outgoing = new Map<string, string[]>();
    const indegree = new Map<string, number>();
    const levels = new Map<string, number>();

    for (const node of nodes) {
        outgoing.set(node.id, []);
        indegree.set(node.id, 0);
        levels.set(node.id, 0);
    }

    for (const edge of graphEdges) {
        outgoing.get(edge.source)?.push(edge.target);
        indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    }

    const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
    let queueIndex = 0;
    while (queueIndex < queue.length) {
        const source = queue[queueIndex++];
        const sourceLevel = levels.get(source) ?? 0;
        for (const target of outgoing.get(source) ?? []) {
            levels.set(target, Math.max(levels.get(target) ?? 0, sourceLevel + 1));
            const nextIndegree = (indegree.get(target) ?? 1) - 1;
            indegree.set(target, nextIndegree);
            if (nextIndegree === 0) {
                queue.push(target);
            }
        }
    }

    // Keep cycles legible: place each strongly-connected remainder in the
    // first column after its already-positioned dependencies.
    for (const node of nodes) {
        if ((indegree.get(node.id) ?? 0) > 0) {
            const incomingLevels = graphEdges
                .filter((edge) => edge.target === node.id && (indegree.get(edge.source) ?? 0) === 0)
                .map((edge) => levels.get(edge.source) ?? 0);
            levels.set(node.id, incomingLevels.length === 0 ? 0 : Math.max(...incomingLevels) + 1);
        }
    }

    const columns = new Map<number, DevtoolsNode[]>();
    for (const node of nodes) {
        const level = levels.get(node.id) ?? 0;
        const column = columns.get(level) ?? [];
        column.push(node);
        columns.set(level, column);
    }

    const nodeWidth = 184;
    const nodeHeight = 58;
    const horizontalGap = 72;
    const verticalGap = 24;
    const margin = 30;
    const positionedNodes: PositionedNode[] = [];
    let largestColumn = 0;
    let largestLevel = 0;

    for (const [level, column] of columns) {
        column.sort((left, right) => nodeLabel(left).localeCompare(nodeLabel(right)));
        largestColumn = Math.max(largestColumn, column.length);
        largestLevel = Math.max(largestLevel, level);
        column.forEach((node, row) => {
            positionedNodes.push({
                node,
                x: margin + level * (nodeWidth + horizontalGap),
                y: margin + row * (nodeHeight + verticalGap),
                width: nodeWidth,
                height: nodeHeight
            });
        });
    }

    return {
        nodes: positionedNodes,
        edges: graphEdges,
        width: margin * 2 + (largestLevel + 1) * nodeWidth + largestLevel * horizontalGap,
        height: margin * 2 + Math.max(1, largestColumn) * nodeHeight + Math.max(0, largestColumn - 1) * verticalGap
    };
}

export function nodeLabel(node: DevtoolsNode): string {
    return node.name ?? `${node.kind} ${node.id}`;
}
