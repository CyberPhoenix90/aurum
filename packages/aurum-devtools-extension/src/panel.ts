import { InspectedPageBridge } from './inspected_page_bridge.js';
import {
    SUPPORTED_PROTOCOL_VERSION,
    normalizeEvents,
    normalizeNode,
    normalizeSnapshot,
    type DevtoolsEvent,
    type DevtoolsNode,
    type DevtoolsSnapshot,
    type RuntimeStatus
} from './protocol.js';
import {
    compactValue,
    createPanelRevision,
    detailedValue,
    filterNodes,
    layoutGraph,
    mergeEvents,
    nodeLabel,
    paginateItems,
    shouldPollPanel,
    shouldRefreshInspection
} from './panel_state.js';

type PanelView = 'graph' | 'nodes' | 'events';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const LIVE_REFRESH_INTERVAL = 500;
const MAXIMUM_GRAPH_NODES = 250;
const NODE_PAGE_SIZE = 200;

class AurumDevtoolsPanel {
    private readonly bridge = new InspectedPageBridge();
    private snapshot: DevtoolsSnapshot = normalizeSnapshot(undefined);
    private status: RuntimeStatus = {
        available: false,
        mode: 'unknown',
        capabilities: [],
        droppedEvents: 0
    };
    private events: DevtoolsEvent[] = [];
    private hiddenEventIds = new Set<string>();
    private hiddenThroughSequence = 0;
    private view: PanelView = 'graph';
    private selectedNodeId?: string;
    private selectedInspection?: unknown;
    private search = '';
    private kind = '';
    private live = true;
    private polling = false;
    private disposed = false;
    private visible = true;
    private bridgeGeneration = 0;
    private nodePage = 0;
    private renderedRevision?: string;
    private inspectionRevision?: string;
    private readonly pollTimer: number;

    private readonly statusBadge: HTMLElement;
    private readonly statusText: HTMLElement;
    private readonly modeNote: HTMLElement;
    private readonly summary: HTMLElement;
    private readonly content: HTMLElement;
    private readonly details: HTMLElement;
    private readonly searchInput: HTMLInputElement;
    private readonly kindSelect: HTMLSelectElement;
    private readonly liveButton: HTMLButtonElement;
    private readonly refreshButton: HTMLButtonElement;
    private readonly clearEventsButton: HTMLButtonElement;
    private readonly viewButtons: HTMLButtonElement[];

    public constructor(private readonly root: HTMLElement) {
        this.root.innerHTML = `
            <div class="panel-shell">
                <header class="topbar">
                    <div class="brand"><span class="brand-mark">Au</span><span>Aurum</span></div>
                    <div class="connection"><span id="status-badge" class="status-badge waiting"></span><span id="status-text">Looking for an Aurum runtime…</span></div>
                    <div class="topbar-actions">
                        <button id="live-button" class="tool-button active" type="button" title="Toggle live updates">Live</button>
                        <button id="refresh-button" class="tool-button" type="button">Refresh</button>
                    </div>
                </header>
                <div id="mode-note" class="mode-note">The extension will attach when an instrumented Aurum runtime is available.</div>
                <section id="summary" class="summary" aria-label="Runtime summary"></section>
                <nav class="view-tabs" aria-label="Inspector views">
                    <button class="view-tab active" type="button" data-view="graph">Data-flow graph</button>
                    <button class="view-tab" type="button" data-view="nodes">Nodes</button>
                    <button class="view-tab" type="button" data-view="events">Events</button>
                    <span class="tab-spacer"></span>
                    <label class="search-field"><span>Search</span><input id="search-input" type="search" placeholder="Name, kind, or id" /></label>
                    <select id="kind-select" class="kind-select" aria-label="Filter by node kind"><option value="">All kinds</option></select>
                    <button id="clear-events" class="tool-button" type="button">Clear events</button>
                </nav>
                <div class="workspace">
                    <section id="content" class="content" aria-live="polite"></section>
                    <aside id="details" class="details" aria-label="Selected node details"></aside>
                </div>
            </div>`;

        this.statusBadge = requiredElement(this.root, '#status-badge');
        this.statusText = requiredElement(this.root, '#status-text');
        this.modeNote = requiredElement(this.root, '#mode-note');
        this.summary = requiredElement(this.root, '#summary');
        this.content = requiredElement(this.root, '#content');
        this.details = requiredElement(this.root, '#details');
        this.searchInput = requiredElement(this.root, '#search-input');
        this.kindSelect = requiredElement(this.root, '#kind-select');
        this.liveButton = requiredElement(this.root, '#live-button');
        this.refreshButton = requiredElement(this.root, '#refresh-button');
        this.clearEventsButton = requiredElement(this.root, '#clear-events');
        this.viewButtons = Array.from(this.root.querySelectorAll<HTMLButtonElement>('[data-view]'));

        this.bindControls();
        this.render(true);
        void this.refresh(true);
        this.pollTimer = window.setInterval(() => {
            if (shouldPollPanel(this.live, this.visible, document.hidden, this.disposed)) {
                void this.refresh();
            }
        }, LIVE_REFRESH_INTERVAL);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.bridgeGeneration++;
                void this.bridge.dispose();
            } else if (this.live) {
                void this.refresh(true);
            }
        });
        window.addEventListener('pagehide', () => this.dispose(), { once: true });
        window.addEventListener('beforeunload', () => this.dispose(), { once: true });

        chrome.devtools.network.onNavigated.addListener(() => {
            this.bridgeGeneration++;
            this.snapshot = normalizeSnapshot(undefined);
            this.events = [];
            this.hiddenEventIds.clear();
            this.hiddenThroughSequence = 0;
            this.selectedNodeId = undefined;
            this.selectedInspection = undefined;
            this.inspectionRevision = undefined;
            this.status = { available: false, mode: 'unknown', capabilities: [], droppedEvents: 0 };
            this.render(true);
            void this.refresh(true);
        });
    }

    private bindControls(): void {
        this.liveButton.addEventListener('click', () => {
            this.live = !this.live;
            this.liveButton.classList.toggle('active', this.live);
            this.liveButton.textContent = this.live ? 'Live' : 'Paused';
            if (this.live) {
                void this.refresh();
            } else {
                this.bridgeGeneration++;
                void this.bridge.dispose();
            }
        });

        this.refreshButton.addEventListener('click', () => void this.refresh(true));
        this.clearEventsButton.addEventListener('click', () => {
            for (const event of this.events) {
                if (event.sequence === undefined) {
                    this.hiddenEventIds.add(event.id);
                } else {
                    this.hiddenThroughSequence = Math.max(this.hiddenThroughSequence, event.sequence);
                }
            }
            this.events = [];
            this.render(true);
        });
        this.searchInput.addEventListener('input', () => {
            this.search = this.searchInput.value;
            this.nodePage = 0;
            this.renderContent();
        });
        this.kindSelect.addEventListener('change', () => {
            this.kind = this.kindSelect.value;
            this.nodePage = 0;
            this.renderContent();
        });

        for (const button of this.viewButtons) {
            button.addEventListener('click', () => {
                this.view = button.dataset.view as PanelView;
                this.render(true);
            });
        }
    }

    private async refresh(forceInspection = false): Promise<void> {
        if (this.polling || this.disposed) {
            return;
        }

        this.polling = true;
        const generation = this.bridgeGeneration;
        const selectedNodeBefore = this.snapshot.nodes.find((node) => node.id === this.selectedNodeId);
        let selectedNodeLegacyEvent = false;
        this.refreshButton.disabled = true;
        try {
            const result = await this.bridge.poll();
            if (generation !== this.bridgeGeneration || this.disposed || !this.visible || document.hidden) {
                void this.bridge.dispose();
                return;
            }
            if (result.runtimeId !== undefined && this.status.runtimeId !== undefined && result.runtimeId !== this.status.runtimeId) {
                this.events = [];
                this.hiddenEventIds.clear();
                this.hiddenThroughSequence = 0;
                this.selectedNodeId = undefined;
                this.selectedInspection = undefined;
                this.inspectionRevision = undefined;
                forceInspection = true;
            }
            if (!result.available && this.status.available) {
                this.snapshot = normalizeSnapshot(undefined);
                this.events = [];
                this.hiddenEventIds.clear();
                this.hiddenThroughSequence = 0;
                this.selectedNodeId = undefined;
                this.selectedInspection = undefined;
                this.inspectionRevision = undefined;
            }
            this.status = result;

            if (result.available) {
                let snapshotEvents: DevtoolsEvent[] = [];
                if (result.snapshot !== undefined) {
                    this.snapshot = normalizeSnapshot(result.snapshot, result);
                    snapshotEvents = this.snapshot.recentEvents;

                    if (this.selectedNodeId !== undefined && !this.snapshot.nodes.some((node) => node.id === this.selectedNodeId)) {
                        this.selectedNodeId = undefined;
                        this.selectedInspection = undefined;
                        this.inspectionRevision = undefined;
                    }

                    if (this.selectedNodeId === undefined && this.snapshot.nodes.length > 0) {
                        this.selectedNodeId = this.snapshot.nodes[0].id;
                        forceInspection = true;
                    }
                }

                // Subscription events continue to arrive when a modern
                // runtime omits its unchanged snapshot.
                const queuedEvents = normalizeEvents(result.events, this.snapshot.timestamp);
                const incomingEvents = [...snapshotEvents, ...queuedEvents].filter(
                    (event) =>
                        !this.hiddenEventIds.has(event.id) &&
                        (event.sequence === undefined || event.sequence > this.hiddenThroughSequence)
                );
                const knownEventIds =
                    this.snapshot.revision === undefined && this.selectedNodeId !== undefined
                        ? new Set(this.events.map((event) => event.id))
                        : undefined;
                this.events = mergeEvents(this.events, incomingEvents);
                selectedNodeLegacyEvent =
                    knownEventIds !== undefined &&
                    this.selectedNodeId !== undefined &&
                    incomingEvents.some((event) => event.nodeId === this.selectedNodeId && !knownEventIds.has(event.id));
            }
        } catch (error) {
            this.status = {
                available: false,
                mode: 'unknown',
                capabilities: [],
                droppedEvents: 0,
                error: error instanceof Error ? error.message : String(error)
            };
        } finally {
            this.polling = false;
            this.refreshButton.disabled = false;
        }

        const selectedNodeAfter = this.snapshot.nodes.find((node) => node.id === this.selectedNodeId);
        const shouldInspect =
            this.selectedNodeId !== undefined &&
            shouldRefreshInspection(forceInspection, selectedNodeBefore, selectedNodeAfter, selectedNodeLegacyEvent);
        if (shouldInspect && !forceInspection) {
            this.selectedInspection = undefined;
            this.inspectionRevision = undefined;
        }
        this.render();
        if (shouldInspect && this.selectedNodeId !== undefined) {
            await this.inspectSelectedNode(this.selectedNodeId);
        }
    }

    private dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.bridgeGeneration++;
        window.clearInterval(this.pollTimer);
        void this.bridge.dispose();
    }

    public setVisible(visible: boolean): void {
        if (this.disposed || this.visible === visible) return;
        this.visible = visible;
        if (!visible) {
            this.bridgeGeneration++;
            void this.bridge.dispose();
        } else if (this.live) {
            void this.refresh(true);
        }
    }

    private render(force = false): void {
        const revision = createPanelRevision(this.snapshot, this.events, this.status);
        if (!force && revision === this.renderedRevision) {
            return;
        }
        this.renderedRevision = revision;
        this.renderStatus();
        this.renderSummary();
        this.renderKindOptions();
        this.clearEventsButton.hidden = this.view !== 'events';
        this.kindSelect.hidden = this.view === 'events';
        for (const button of this.viewButtons) {
            button.classList.toggle('active', button.dataset.view === this.view);
        }
        this.renderContent();
        this.renderDetails();
    }

    private renderStatus(): void {
        this.statusBadge.className = 'status-badge';

        if (!this.status.available) {
            this.statusBadge.classList.add(this.status.error === undefined ? 'waiting' : 'error');
            this.statusText.textContent = this.status.error === undefined ? 'Waiting for an Aurum runtime' : 'Could not inspect this page';
            this.modeNote.textContent =
                this.status.error ?? 'Load or refresh a page built with an instrumented @aurum/streams runtime to begin inspecting it.';
            return;
        }

        const unsupported = this.status.protocolVersion !== SUPPORTED_PROTOCOL_VERSION;
        this.statusBadge.classList.add(unsupported ? 'warning' : 'connected');
        const versionText = this.status.protocolVersion === undefined ? 'unknown protocol' : `protocol v${this.status.protocolVersion}`;
        this.statusText.textContent = unsupported
            ? `Connected with unsupported ${versionText}`
            : `Connected · ${this.status.mode} · ${versionText}`;

        const capabilityText = this.status.capabilities.length === 0 ? '' : ` Capabilities: ${this.status.capabilities.join(', ')}.`;
        const weakReferenceText =
            this.snapshot.weakReferences === false
                ? ' This browser lacks WeakRef support, so the runtime bounds retained inspection records.'
                : '';
        if (unsupported) {
            this.modeNote.textContent = `This extension supports protocol v${SUPPORTED_PROTOCOL_VERSION}; partial data is shown where possible.${capabilityText}`;
        } else if (this.status.mode === 'debug') {
            this.modeNote.textContent = `Debug metadata is active: names, annotations, and creation stacks are available.${capabilityText}${weakReferenceText}`;
        } else {
            this.modeNote.textContent = `Production metadata is intentionally lean and omits names, labels, and values; topology, subscription counts, and events remain inspectable.${capabilityText}${weakReferenceText}`;
        }
        if (this.status.bridgeMode === 'snapshot-only') {
            this.modeNote.textContent += ' The page global cannot host the live bridge, so this panel is using snapshot polling.';
        } else if (this.status.error !== undefined) {
            this.modeNote.textContent += ` Live bridge warning: ${this.status.error.split('\n')[0]}`;
        }
    }

    private renderSummary(): void {
        clear(this.summary);
        const subscriptionCount = this.snapshot.nodes.reduce((total, node) => total + node.subscriberCount, 0);
        const values: Array<[string, string]> = [
            ['Nodes', String(this.snapshot.nodes.length)],
            ['Edges', String(this.snapshot.edges.length)],
            ['Subscriptions', String(subscriptionCount)],
            ['Events', String(this.events.length)]
        ];

        for (const [label, value] of values) {
            const item = htmlElement('div', 'summary-item');
            item.append(htmlElement('strong', 'summary-value', value), htmlElement('span', 'summary-label', label));
            this.summary.append(item);
        }

        if (this.status.droppedEvents > 0) {
            this.summary.append(htmlElement('span', 'dropped-events', `${this.status.droppedEvents} events dropped before this refresh`));
        }
    }

    private renderKindOptions(): void {
        const previousValue = this.kindSelect.value;
        const kinds = Array.from(new Set(this.snapshot.nodes.map((node) => node.kind))).sort((left, right) => left.localeCompare(right));
        clear(this.kindSelect);
        this.kindSelect.append(new Option('All kinds', ''));
        for (const kind of kinds) {
            this.kindSelect.append(new Option(kind, kind));
        }
        this.kindSelect.value = kinds.includes(previousValue) ? previousValue : '';
        this.kind = this.kindSelect.value;
    }

    private renderContent(): void {
        clear(this.content);
        if (!this.status.available) {
            this.content.append(emptyState('No Aurum runtime detected', 'The panel reconnects automatically, including after page navigation.'));
            return;
        }

        if (this.view === 'graph') {
            this.renderGraph();
        } else if (this.view === 'nodes') {
            this.renderNodes();
        } else {
            this.renderEvents();
        }
    }

    private renderGraph(): void {
        const filteredNodes = filterNodes(this.snapshot.nodes, this.search, this.kind);
        if (filteredNodes.length === 0) {
            this.content.append(emptyState('No matching nodes', 'Change the search or kind filter to see more of the graph.'));
            return;
        }

        const visibleNodes = filteredNodes.slice(0, MAXIMUM_GRAPH_NODES);
        const visibleIds = new Set(visibleNodes.map((node) => node.id));
        const layout = layoutGraph(
            visibleNodes,
            this.snapshot.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
        );
        const positionById = new Map(layout.nodes.map((position) => [position.node.id, position]));
        const wrapper = htmlElement('div', 'graph-scroll');
        if (filteredNodes.length > visibleNodes.length) {
            wrapper.append(
                htmlElement(
                    'div',
                    'graph-limit',
                    `Showing ${visibleNodes.length} of ${filteredNodes.length} matching nodes. Narrow the filter to inspect the rest.`
                )
            );
        }

        const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
        svg.classList.add('graph');
        svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
        svg.setAttribute('width', String(layout.width));
        svg.setAttribute('height', String(layout.height));
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', 'Aurum data-flow graph');

        const definitions = document.createElementNS(SVG_NAMESPACE, 'defs');
        const marker = document.createElementNS(SVG_NAMESPACE, 'marker');
        marker.setAttribute('id', 'arrow');
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '5');
        marker.setAttribute('markerHeight', '5');
        marker.setAttribute('orient', 'auto-start-reverse');
        const arrow = document.createElementNS(SVG_NAMESPACE, 'path');
        arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        marker.append(arrow);
        definitions.append(marker);
        svg.append(definitions);

        const edgeGroup = document.createElementNS(SVG_NAMESPACE, 'g');
        edgeGroup.classList.add('graph-edges');
        for (const edge of layout.edges) {
            const source = positionById.get(edge.source);
            const target = positionById.get(edge.target);
            if (source === undefined || target === undefined) {
                continue;
            }
            const startX = source.x + source.width;
            const startY = source.y + source.height / 2;
            const endX = target.x;
            const endY = target.y + target.height / 2;
            const bend = Math.max(30, Math.abs(endX - startX) / 2);
            const path = document.createElementNS(SVG_NAMESPACE, 'path');
            path.setAttribute('d', `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`);
            path.setAttribute('marker-end', 'url(#arrow)');
            const title = document.createElementNS(SVG_NAMESPACE, 'title');
            title.textContent = edge.label ?? edge.kind ?? `${edge.source} → ${edge.target}`;
            path.append(title);
            edgeGroup.append(path);
        }
        svg.append(edgeGroup);

        const nodeGroup = document.createElementNS(SVG_NAMESPACE, 'g');
        for (const positioned of layout.nodes) {
            const group = document.createElementNS(SVG_NAMESPACE, 'g');
            group.classList.add('graph-node');
            if (positioned.node.id === this.selectedNodeId) {
                group.classList.add('selected');
            }
            group.setAttribute('transform', `translate(${positioned.x} ${positioned.y})`);
            group.setAttribute('tabindex', '0');
            group.setAttribute('role', 'button');
            group.addEventListener('click', () => this.selectNode(positioned.node.id));
            group.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.selectNode(positioned.node.id);
                }
            });

            const rectangle = document.createElementNS(SVG_NAMESPACE, 'rect');
            rectangle.setAttribute('width', String(positioned.width));
            rectangle.setAttribute('height', String(positioned.height));
            rectangle.setAttribute('rx', '7');
            const title = svgText(10, 19, nodeLabel(positioned.node), 'graph-node-title');
            const value = svgText(
                10,
                37,
                positioned.node.value === undefined
                    ? this.status.mode === 'production'
                        ? 'Not captured'
                        : `version ${positioned.node.version ?? 0} · select to inspect`
                    : compactValue(positioned.node.value, 27),
                'graph-node-value'
            );
            const subscriptions = svgText(
                positioned.width - 10,
                51,
                `${positioned.node.subscriberCount} sub${positioned.node.subscriberCount === 1 ? '' : 's'}`,
                'graph-node-subscriptions'
            );
            subscriptions.setAttribute('text-anchor', 'end');
            group.append(rectangle, title, value, subscriptions);
            nodeGroup.append(group);
        }
        svg.append(nodeGroup);
        wrapper.append(svg);
        this.content.append(wrapper);
    }

    private renderNodes(): void {
        const nodes = filterNodes(this.snapshot.nodes, this.search, this.kind).sort((left, right) =>
            nodeLabel(left).localeCompare(nodeLabel(right))
        );
        if (nodes.length === 0) {
            this.content.append(emptyState('No matching nodes', 'Change the search or kind filter to inspect another source.'));
            return;
        }

        const page = paginateItems(nodes, this.nodePage, NODE_PAGE_SIZE);
        this.nodePage = page.page;
        const container = htmlElement('div', 'node-list');
        container.append(this.nodePagination(page.start, page.end, page.total, page.page, page.pageCount));
        const table = htmlElement('table', 'data-table');
        table.innerHTML = '<thead><tr><th>Name</th><th>Kind</th><th>Value</th><th>Version</th><th>Subscriptions</th></tr></thead>';
        const body = document.createElement('tbody');
        for (const node of page.items) {
            const row = document.createElement('tr');
            row.classList.toggle('selected', node.id === this.selectedNodeId);
            row.tabIndex = 0;
            row.append(
                tableCell(node.name ?? node.id, 'node-name'),
                tableCell(node.kind, 'kind-cell'),
                tableCell(
                    node.value === undefined
                        ? this.status.mode === 'production'
                            ? 'Not captured'
                            : 'Select to inspect'
                        : compactValue(node.value, 100),
                    'value-cell'
                ),
                tableCell(node.version === undefined ? '—' : String(node.version)),
                tableCell(String(node.subscriberCount), 'numeric-cell')
            );
            row.addEventListener('click', () => this.selectNode(node.id));
            row.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.selectNode(node.id);
                }
            });
            body.append(row);
        }
        table.append(body);
        const wrapper = htmlElement('div', 'table-scroll');
        wrapper.append(table);
        container.append(wrapper);
        this.content.append(container);
    }

    private nodePagination(start: number, end: number, total: number, page: number, pageCount: number): HTMLElement {
        const pagination = htmlElement('div', 'pagination');
        const previous = htmlElement('button', 'tool-button', 'Previous') as HTMLButtonElement;
        previous.type = 'button';
        previous.disabled = page === 0;
        previous.addEventListener('click', () => {
            this.nodePage = Math.max(0, page - 1);
            this.renderContent();
        });
        const next = htmlElement('button', 'tool-button', 'Next') as HTMLButtonElement;
        next.type = 'button';
        next.disabled = page >= pageCount - 1;
        next.addEventListener('click', () => {
            this.nodePage = Math.min(pageCount - 1, page + 1);
            this.renderContent();
        });
        const range = total === 0 ? '0 nodes' : `${start + 1}–${end} of ${total} nodes · page ${page + 1} of ${pageCount}`;
        pagination.append(htmlElement('span', 'pagination-range', range), previous, next);
        return pagination;
    }

    private renderEvents(): void {
        const query = this.search.trim().toLocaleLowerCase();
        const events = this.events
            .filter((event) => {
                if (query === '') {
                    return true;
                }
                return `${event.type} ${event.updateKind ?? ''} ${event.nodeId ?? ''} ${event.edgeId ?? ''} ${compactValue(event.value, 200)}`
                    .toLocaleLowerCase()
                    .includes(query);
            })
            .slice()
            .reverse();

        if (events.length === 0) {
            this.content.append(emptyState('No events to show', 'Keep Live enabled and interact with the application to record data-flow changes.'));
            return;
        }

        const list = htmlElement('ol', 'event-list');
        for (const event of events) {
            const item = htmlElement('li', 'event-item');
            const heading = htmlElement('div', 'event-heading');
            heading.append(
                htmlElement('time', 'event-time', formatTime(event.timestamp)),
                htmlElement('span', `event-type event-${event.type}`, event.type),
                htmlElement('span', 'event-node', event.nodeId ?? event.edgeId ?? 'runtime')
            );
            const detailParts = [
                event.updateKind,
                event.channel === undefined ? undefined : `${event.channel}: ${event.count ?? '?'}`,
                event.value === undefined ? undefined : compactValue(event.value, 180)
            ].filter((part): part is string => part !== undefined);
            if (detailParts.length > 0) {
                heading.append(htmlElement('span', 'event-description', detailParts.join(' · ')));
            }
            item.append(heading);

            if (event.details !== undefined) {
                const details = htmlElement('pre', 'event-details', detailedValue(event.details));
                item.append(details);
            }

            const relatedEdge =
                event.edgeId === undefined ? undefined : this.snapshot.edges.find((edge) => edge.id === event.edgeId);
            const relatedNodeId = event.nodeId ?? event.sourceId ?? event.targetId ?? relatedEdge?.source ?? relatedEdge?.target;
            if (relatedNodeId !== undefined && this.snapshot.nodes.some((node) => node.id === relatedNodeId)) {
                item.classList.add('selectable');
                item.addEventListener('click', () => this.selectNode(relatedNodeId));
            }
            list.append(item);
        }
        this.content.append(list);
    }

    private renderDetails(): void {
        clear(this.details);
        const node = this.snapshot.nodes.find((candidate) => candidate.id === this.selectedNodeId);
        if (node === undefined) {
            this.details.append(emptyState('Select a node', 'Node values, subscriptions, relationships, and debug metadata appear here.'));
            return;
        }
        const inspectedNode = this.selectedInspection === undefined ? undefined : normalizeNode(this.selectedInspection);
        const detailedNode = inspectedNode?.id === node.id ? inspectedNode : node;

        const header = htmlElement('div', 'details-header');
        header.append(
            htmlElement('span', 'kind-pill', detailedNode.kind),
            htmlElement('h2', '', detailedNode.name ?? node.name ?? node.id)
        );
        this.details.append(header);

        const facts = htmlElement('dl', 'facts');
        appendFact(facts, 'ID', node.id);
        appendFact(facts, 'Version', detailedNode.version === undefined ? '—' : String(detailedNode.version));
        appendFact(facts, 'Subscriptions', String(detailedNode.subscriberCount));
        appendFact(facts, 'Created', formatCreatedAt(detailedNode.createdAt ?? node.createdAt));
        this.details.append(facts);

        this.details.append(
            detailSection(
                'Current value',
                detailedNode.value === undefined && this.status.mode === 'production'
                    ? 'Not captured in production'
                    : detailedValue(detailedNode.value),
                'value-detail'
            )
        );

        const channelEntries = Object.entries(detailedNode.subscriptions);
        if (channelEntries.length > 0) {
            const channels = htmlElement('div', 'relationship-list');
            for (const [channel, count] of channelEntries) {
                const row = htmlElement('div', 'subscription-row');
                row.append(htmlElement('span', '', channel), htmlElement('strong', '', String(count)));
                channels.append(row);
            }
            this.details.append(detailContainer('Subscription channels', channels));
        }

        const incoming = this.snapshot.edges.filter((edge) => edge.target === node.id);
        const outgoing = this.snapshot.edges.filter((edge) => edge.source === node.id);
        this.details.append(this.relationshipSection('Upstream', incoming.map((edge) => ({ id: edge.source, edge }))));
        this.details.append(this.relationshipSection('Downstream', outgoing.map((edge) => ({ id: edge.target, edge }))));

        if (detailedNode.annotations !== undefined) {
            this.details.append(detailSection('Metadata', detailedValue(detailedNode.annotations), 'metadata-detail'));
        }
        if (detailedNode.stack !== undefined) {
            this.details.append(detailSection('Creation stack', detailedNode.stack, 'stack-detail'));
        }
        if (this.selectedInspection !== undefined && inspectedNode?.id !== node.id) {
            this.details.append(detailSection('Inspection result', detailedValue(this.selectedInspection), 'inspection-detail'));
        }
    }

    private relationshipSection(
        title: string,
        relationships: Array<{ id: string; edge: DevtoolsSnapshot['edges'][number] }>
    ): HTMLElement {
        const list = htmlElement('div', 'relationship-list');
        if (relationships.length === 0) {
            list.append(htmlElement('span', 'empty-inline', 'None'));
        } else {
            for (const relationship of relationships) {
                const linkedNode = this.snapshot.nodes.find((node) => node.id === relationship.id);
                const button = htmlElement('button', 'relationship-button') as HTMLButtonElement;
                button.type = 'button';
                button.append(
                    htmlElement('span', 'relationship-name', linkedNode === undefined ? relationship.id : nodeLabel(linkedNode)),
                    htmlElement('span', 'relationship-kind', relationship.edge.label ?? relationship.edge.kind ?? 'flow')
                );
                button.addEventListener('click', () => this.selectNode(relationship.id));
                list.append(button);
            }
        }
        return detailContainer(title, list);
    }

    private selectNode(nodeId: string): void {
        this.selectedNodeId = nodeId;
        this.selectedInspection = undefined;
        this.inspectionRevision = undefined;
        this.renderContent();
        this.renderDetails();
        void this.inspectSelectedNode(nodeId);
    }

    private async inspectSelectedNode(nodeId: string): Promise<void> {
        if (this.status.mode === 'production' || !this.status.capabilities.includes('inspect')) {
            return;
        }

        const inspection = await this.bridge.inspect(nodeId).catch((error: unknown) => ({
            inspectionError: error instanceof Error ? error.message : String(error)
        }));
        if (this.selectedNodeId === nodeId) {
            const revision = detailedValue(inspection);
            if (revision !== this.inspectionRevision) {
                this.inspectionRevision = revision;
                this.selectedInspection = inspection;
                this.renderDetails();
            }
        }
    }
}

function requiredElement<ElementType extends Element>(root: ParentNode, selector: string): ElementType {
    const result = root.querySelector<ElementType>(selector);
    if (result === null) {
        throw new Error(`Missing panel element: ${selector}`);
    }
    return result;
}

function htmlElement<Tag extends keyof HTMLElementTagNameMap>(
    tag: Tag,
    className = '',
    text?: string
): HTMLElementTagNameMap[Tag] {
    const result = document.createElement(tag);
    if (className !== '') {
        result.className = className;
    }
    if (text !== undefined) {
        result.textContent = text;
    }
    return result;
}

function svgText(x: number, y: number, text: string, className: string): SVGTextElement {
    const result = document.createElementNS(SVG_NAMESPACE, 'text');
    result.setAttribute('x', String(x));
    result.setAttribute('y', String(y));
    result.setAttribute('class', className);
    result.textContent = text;
    return result;
}

function tableCell(text: string, className = ''): HTMLTableCellElement {
    return htmlElement('td', className, text);
}

function clear(element: Element): void {
    element.replaceChildren();
}

function emptyState(title: string, description: string): HTMLElement {
    const result = htmlElement('div', 'empty-state');
    result.append(htmlElement('strong', '', title), htmlElement('span', '', description));
    return result;
}

function appendFact(list: HTMLDListElement, label: string, value: string): void {
    list.append(htmlElement('dt', '', label), htmlElement('dd', '', value));
}

function detailContainer(title: string, content: HTMLElement): HTMLElement {
    const section = htmlElement('section', 'detail-section');
    section.append(htmlElement('h3', '', title), content);
    return section;
}

function detailSection(title: string, text: string, className: string): HTMLElement {
    return detailContainer(title, htmlElement('pre', className, text));
}

function formatCreatedAt(value: number | string | undefined): string {
    if (value === undefined) {
        return '—';
    }
    if (typeof value === 'number') {
        return new Date(value).toLocaleString();
    }
    return value;
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return `${time}.${String(date.getMilliseconds()).padStart(3, '0')}`;
}

const root = document.querySelector<HTMLElement>('#app');
if (root === null) {
    throw new Error('Aurum DevTools panel could not find its root element');
}
const panel = new AurumDevtoolsPanel(root);
window.__AURUM_DEVTOOLS_PANEL__ = { setVisible: (visible) => panel.setVisible(visible) };
