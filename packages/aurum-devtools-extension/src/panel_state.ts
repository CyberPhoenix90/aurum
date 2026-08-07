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

export interface ComponentTreeEntry {
    node: DevtoolsNode;
    depth: number;
    parentId?: string;
}

export interface ArrayPreview {
    size: number;
    truncated: boolean;
    items: Array<{ index: string; value: unknown }>;
}

export interface RelatedGraphNodes {
    upstream: Set<string>;
    downstream: Set<string>;
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

export function updatedNodeIds(events: readonly DevtoolsEvent[]): string[] {
    return Array.from(
        new Set(
            events.flatMap((event) => (event.type === 'node-updated' && event.nodeId !== undefined ? [event.nodeId] : []))
        )
    );
}

export function relatedGraphNodeIds(selectedNodeId: string | undefined, edges: readonly DevtoolsEdge[]): RelatedGraphNodes {
    const upstream = new Set<string>();
    const downstream = new Set<string>();
    if (selectedNodeId === undefined) return { upstream, downstream };
    for (const edge of edges) {
        if (edge.target === selectedNodeId) upstream.add(edge.source);
        if (edge.source === selectedNodeId) downstream.add(edge.target);
    }
    return { upstream, downstream };
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

export function isArrayDataSourceNode(node: Pick<DevtoolsNode, 'kind'>): boolean {
    return node.kind.toLocaleLowerCase().replace(/[^a-z]/g, '').includes('arraydatasource');
}

export function arrayPreview(value: unknown): ArrayPreview | undefined {
    if (typeof value !== 'object' || value === null) return undefined;
    const preview = value as { type?: unknown; size?: unknown; entries?: unknown; truncated?: unknown };
    if (preview.type !== 'array' || !Array.isArray(preview.entries)) return undefined;
    const items = preview.entries.flatMap((entry, position) => {
        if (typeof entry !== 'object' || entry === null || !('value' in entry)) return [];
        const candidate = entry as { key?: unknown; value: unknown };
        return [{ index: typeof candidate.key === 'string' ? candidate.key : String(position), value: candidate.value }];
    });
    return {
        size: typeof preview.size === 'number' && Number.isFinite(preview.size) ? preview.size : items.length,
        truncated: preview.truncated === true,
        items
    };
}

export function buildComponentTree(nodes: DevtoolsNode[], edges: DevtoolsEdge[]): ComponentTreeEntry[] {
    const relevantNodes = nodes.filter((node) => node.kind === 'component' || node.kind === 'dom-element');
    const nodeById = new Map(relevantNodes.map((node) => [node.id, node]));
    const componentParents = new Map<string, string>();
    const domParents = new Map<string, string>();
    const domOwners = new Map<string, string>();

    for (const edge of edges) {
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);
        if (source === undefined || target === undefined) continue;
        if (edge.kind === 'component-child' && source.kind === 'component' && target.kind === 'component') {
            componentParents.set(target.id, source.id);
        } else if (edge.kind === 'dom-child' && source.kind === 'dom-element' && target.kind === 'dom-element') {
            domParents.set(target.id, source.id);
        } else if (edge.kind === 'component-output' && source.kind === 'component' && target.kind === 'dom-element') {
            domOwners.set(target.id, source.id);
        }
    }

    const parentById = new Map<string, string>();
    for (const node of relevantNodes) {
        if (node.kind === 'component') {
            let hostParent: string | undefined;
            for (const [domId, ownerId] of domOwners) {
                const domParent = domParents.get(domId);
                if (ownerId === node.id && domParent !== undefined && domOwners.get(domParent) !== node.id) {
                    hostParent = domParent;
                    break;
                }
            }
            const parent = hostParent ?? componentParents.get(node.id);
            if (parent !== undefined) parentById.set(node.id, parent);
            continue;
        }
        const owner = domOwners.get(node.id);
        const domParent = domParents.get(node.id);
        const domParentOwner = domParent === undefined ? undefined : domOwners.get(domParent);
        const parent = domParent !== undefined && (owner === undefined || owner === domParentOwner) ? domParent : owner ?? domParent;
        if (parent !== undefined && parent !== node.id) parentById.set(node.id, parent);
    }

    const children = new Map<string, DevtoolsNode[]>();
    for (const node of relevantNodes) {
        const parent = parentById.get(node.id);
        if (parent === undefined || !nodeById.has(parent)) continue;
        const siblings = children.get(parent) ?? [];
        siblings.push(node);
        children.set(parent, siblings);
    }
    const order = new Map(nodes.map((node, index) => [node.id, index]));
    for (const siblings of children.values()) siblings.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));

    const result: ComponentTreeEntry[] = [];
    const visited = new Set<string>();
    const append = (node: DevtoolsNode, depth: number): void => {
        if (visited.has(node.id)) return;
        visited.add(node.id);
        const parentId = parentById.get(node.id);
        result.push({ node, depth, ...(parentId === undefined ? {} : { parentId }) });
        for (const child of children.get(node.id) ?? []) append(child, depth + 1);
    };
    for (const node of relevantNodes) {
        if (!parentById.has(node.id)) append(node, 0);
    }
    // Malformed or cyclic third-party snapshots remain inspectable.
    for (const node of relevantNodes) append(node, 0);
    return result;
}

export function filterComponentTree(entries: ComponentTreeEntry[], query: string, kind: string): ComponentTreeEntry[] {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (normalizedQuery === '' && kind === '') return entries;
    const byId = new Map(entries.map((entry) => [entry.node.id, entry]));
    const included = new Set<string>();
    for (const entry of entries) {
        const matchesKind = kind === '' || entry.node.kind === kind;
        const searchable = `${entry.node.name ?? ''}\n${entry.node.kind}\n${entry.node.id}`.toLocaleLowerCase();
        if (!matchesKind || (normalizedQuery !== '' && !searchable.includes(normalizedQuery))) continue;
        let current: ComponentTreeEntry | undefined = entry;
        while (current !== undefined && !included.has(current.node.id)) {
            included.add(current.node.id);
            current = current.parentId === undefined ? undefined : byId.get(current.parentId);
        }
    }
    return entries.filter((entry) => included.has(entry.node.id));
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
