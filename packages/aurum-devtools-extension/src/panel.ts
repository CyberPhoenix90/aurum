import { Aurum, type Renderable } from '@aurum/html';
import { ArrayDataSource, type CancellationToken } from '@aurum/streams';
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
    arrayPreview,
    buildComponentTree,
    compactValue,
    createPanelRevision,
    detailedValue,
    filterComponentTree,
    filterNodes,
    isComponentNode,
    isDataSourceNode,
    isDomElementNode,
    isArrayDataSourceNode,
    layoutGraph,
    mergeEvents,
    navigateComponentTree,
    nodeLabel,
    paginateItems,
    relatedGraphNodeIds,
    shouldPollPanel,
    shouldRefreshInspection,
    updatedNodeIds,
    visibleComponentTree,
    type ComponentTreeEntry,
    type ComponentTreeNavigationKey
} from './panel_state.js';

type PanelView = 'graph' | 'components' | 'arrays' | 'nodes' | 'events';

interface GraphNodeElement {
    group: SVGGElement;
    title: SVGTextElement;
    value: SVGTextElement;
    subscriptions: SVGTextElement;
}

interface GraphEdgeElement {
    path: SVGPathElement;
    title: SVGTitleElement;
}

interface NodeRowElement {
    row: HTMLTableRowElement;
    name: HTMLTableCellElement;
    kind: HTMLTableCellElement;
    value: HTMLTableCellElement;
    version: HTMLTableCellElement;
    subscriptions: HTMLTableCellElement;
}

interface EventItemElement {
    item: HTMLLIElement;
    time: HTMLTimeElement;
    type: HTMLSpanElement;
    node: HTMLSpanElement;
    description: HTMLSpanElement;
    details: HTMLPreElement;
    relatedNodeId?: string;
}

interface ComponentRowElement {
    row: HTMLDivElement;
    disclosure: HTMLSpanElement;
    icon: HTMLSpanElement;
    label: HTMLSpanElement;
    detail: HTMLSpanElement;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const LIVE_REFRESH_INTERVAL = 500;
const MAXIMUM_GRAPH_NODES = 250;
const NODE_PAGE_SIZE = 200;
const NODE_UPDATE_FLASH_DURATION = 700;
const DOM_SELECTION_HIGHLIGHT_DURATION = 1_500;

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
    private hoveredGraphNodeId?: string;
    private focusedComponentNodeId?: string;
    private readonly collapsedComponentNodeIds = new Set<string>();
    private readonly flashingNodeIds = new Set<string>();
    private readonly nodeFlashTimers = new Map<string, number>();
    private readonly breakpointRequests = new Set<string>();
    private readonly graphNodes = new ArrayDataSource<Renderable>();
    private readonly graphEdges = new ArrayDataSource<Renderable>();
    private readonly componentRows = new ArrayDataSource<Renderable>();
    private readonly nodeRows = new ArrayDataSource<Renderable>();
    private readonly eventItems = new ArrayDataSource<Renderable>();
    private readonly graphNodeElements = new Map<string, GraphNodeElement>();
    private readonly graphEdgeElements = new Map<string, GraphEdgeElement>();
    private readonly componentRowElements = new Map<string, ComponentRowElement>();
    private readonly nodeRowElements = new Map<string, NodeRowElement>();
    private readonly eventItemElements = new Map<string, EventItemElement>();
    private readonly aurumAttachments: CancellationToken[] = [];
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
    private readonly graphView: HTMLElement;
    private readonly graphEmpty: HTMLElement;
    private readonly graphLimit: HTMLElement;
    private readonly graphSvg: SVGSVGElement;
    private readonly graphEdgeGroup: SVGGElement;
    private readonly graphNodeGroup: SVGGElement;
    private readonly componentsView: HTMLElement;
    private readonly componentsEmpty: HTMLElement;
    private readonly componentToolbar: HTMLElement;
    private readonly componentCount: HTMLElement;
    private readonly componentExpandAllButton: HTMLButtonElement;
    private readonly componentCollapseAllButton: HTMLButtonElement;
    private readonly componentList: HTMLElement;
    private readonly nodesView: HTMLElement;
    private readonly nodesEmpty: HTMLElement;
    private readonly nodeSurface: HTMLElement;
    private readonly nodeTableScroll: HTMLElement;
    private readonly nodeRange: HTMLElement;
    private readonly nodePreviousButton: HTMLButtonElement;
    private readonly nodeNextButton: HTMLButtonElement;
    private readonly eventsView: HTMLElement;
    private readonly eventsEmpty: HTMLElement;
    private readonly eventList: HTMLOListElement;

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
                    <button class="view-tab" type="button" data-view="components">Components</button>
                    <button class="view-tab" type="button" data-view="arrays">Arrays</button>
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

        this.graphView = htmlElement('div', 'panel-view graph-scroll');
        this.graphEmpty = emptyState('No matching nodes', 'Change the search or kind filter to see more of the graph.');
        this.graphLimit = htmlElement('div', 'graph-limit');
        this.graphLimit.hidden = true;
        this.graphSvg = document.createElementNS(SVG_NAMESPACE, 'svg');
        this.graphSvg.classList.add('graph');
        this.graphSvg.setAttribute('role', 'img');
        this.graphSvg.setAttribute('aria-label', 'Aurum data-flow graph');
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
        this.graphEdgeGroup = document.createElementNS(SVG_NAMESPACE, 'g');
        this.graphEdgeGroup.classList.add('graph-edges');
        this.graphNodeGroup = document.createElementNS(SVG_NAMESPACE, 'g');
        this.graphSvg.append(definitions, this.graphEdgeGroup, this.graphNodeGroup);
        this.graphView.append(this.graphEmpty, this.graphLimit, this.graphSvg);

        this.componentsView = htmlElement('div', 'panel-view component-view');
        this.componentsEmpty = emptyState(
            'No component hierarchy',
            'Component and host DOM hierarchy is collected only by debug/dev instrumented builds.'
        );
        this.componentToolbar = htmlElement('div', 'component-toolbar');
        this.componentCount = htmlElement('span', 'component-count');
        const componentToolbarActions = htmlElement('span', 'component-toolbar-actions');
        this.componentExpandAllButton = htmlElement('button', 'tree-tool-button', 'Expand all') as HTMLButtonElement;
        this.componentExpandAllButton.type = 'button';
        this.componentCollapseAllButton = htmlElement('button', 'tree-tool-button', 'Collapse all') as HTMLButtonElement;
        this.componentCollapseAllButton.type = 'button';
        componentToolbarActions.append(this.componentExpandAllButton, this.componentCollapseAllButton);
        this.componentToolbar.append(this.componentCount, componentToolbarActions);
        this.componentList = htmlElement('div', 'component-tree');
        this.componentList.setAttribute('role', 'tree');
        this.componentList.setAttribute('aria-label', 'Aurum component and host element hierarchy');
        this.componentsView.append(this.componentsEmpty, this.componentToolbar, this.componentList);

        this.nodesView = htmlElement('div', 'panel-view');
        this.nodesEmpty = emptyState('No matching nodes', 'Change the search or kind filter to inspect another source.');
        this.nodeSurface = htmlElement('div', 'node-list');
        const pagination = htmlElement('div', 'pagination');
        this.nodeRange = htmlElement('span', 'pagination-range');
        this.nodePreviousButton = htmlElement('button', 'tool-button', 'Previous') as HTMLButtonElement;
        this.nodePreviousButton.type = 'button';
        this.nodePreviousButton.addEventListener('click', () => {
            this.nodePage = Math.max(0, this.nodePage - 1);
            this.nodeTableScroll.scrollTop = 0;
            this.renderNodes();
        });
        this.nodeNextButton = htmlElement('button', 'tool-button', 'Next') as HTMLButtonElement;
        this.nodeNextButton.type = 'button';
        this.nodeNextButton.addEventListener('click', () => {
            this.nodePage++;
            this.nodeTableScroll.scrollTop = 0;
            this.renderNodes();
        });
        pagination.append(this.nodeRange, this.nodePreviousButton, this.nodeNextButton);
        const table = htmlElement('table', 'data-table');
        table.innerHTML = '<thead><tr><th>Name</th><th>Kind</th><th>Value</th><th>Version</th><th>Subscriptions</th></tr></thead>';
        const body = document.createElement('tbody');
        table.append(body);
        this.nodeTableScroll = htmlElement('div', 'table-scroll');
        this.nodeTableScroll.append(table);
        this.nodeSurface.append(pagination, this.nodeTableScroll);
        this.nodesView.append(this.nodesEmpty, this.nodeSurface);

        this.eventsView = htmlElement('div', 'panel-view');
        this.eventsEmpty = emptyState('No events to show', 'Keep Live enabled and interact with the application to record data-flow changes.');
        this.eventList = htmlElement('ol', 'event-list');
        this.eventsView.append(this.eventsEmpty, this.eventList);

        this.aurumAttachments.push(
            Aurum.attach([this.graphView, this.componentsView, this.nodesView, this.eventsView] as unknown as Renderable, this.content),
            Aurum.attach(this.graphEdges, this.graphEdgeGroup as unknown as HTMLElement),
            Aurum.attach(this.graphNodes, this.graphNodeGroup as unknown as HTMLElement),
            Aurum.attach(this.componentRows, this.componentList),
            Aurum.attach(this.nodeRows, body as unknown as HTMLElement),
            Aurum.attach(this.eventItems, this.eventList)
        );

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
            this.resetComponentTreeState();
            this.clearNodeUpdateFlashes();
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
        this.componentExpandAllButton.addEventListener('click', () => {
            this.collapsedComponentNodeIds.clear();
            this.renderComponents();
            this.focusComponentRow(this.focusedComponentNodeId);
        });
        this.componentCollapseAllButton.addEventListener('click', () => {
            const entries = this.filteredComponentTree();
            const parentIds = new Set(entries.flatMap((entry) => (entry.parentId === undefined ? [] : [entry.parentId])));
            this.collapsedComponentNodeIds.clear();
            for (const parentId of parentIds) this.collapsedComponentNodeIds.add(parentId);
            this.renderComponents();
            this.focusComponentRow(this.focusedComponentNodeId);
        });

        for (const button of this.viewButtons) {
            button.addEventListener('click', () => {
                this.view = button.dataset.view as PanelView;
                if (this.view === 'components' && this.kind !== '' && this.kind !== 'component' && this.kind !== 'dom-element') {
                    this.kind = '';
                    this.kindSelect.value = '';
                }
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
                this.resetComponentTreeState();
                this.clearNodeUpdateFlashes();
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
                this.resetComponentTreeState();
                this.clearNodeUpdateFlashes();
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
                this.flashUpdatedNodes(queuedEvents);
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
        this.clearNodeUpdateFlashes();
        for (const attachment of this.aurumAttachments) attachment.cancel();
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
        this.kindSelect.hidden = this.view === 'events' || this.view === 'arrays';
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
        if (!this.status.available) {
            this.graphView.hidden = false;
            this.componentsView.hidden = true;
            this.nodesView.hidden = true;
            this.eventsView.hidden = true;
            setEmptyState(this.graphEmpty, 'No Aurum runtime detected', 'The panel reconnects automatically, including after page navigation.');
            this.graphEmpty.hidden = false;
            this.graphLimit.hidden = true;
            setElementHidden(this.graphSvg, true);
            return;
        }

        this.graphView.hidden = this.view !== 'graph';
        this.componentsView.hidden = this.view !== 'components';
        this.nodesView.hidden = this.view !== 'nodes' && this.view !== 'arrays';
        this.eventsView.hidden = this.view !== 'events';
        if (this.view === 'graph') {
            this.renderGraph();
        } else if (this.view === 'components') {
            this.renderComponents();
        } else if (this.view === 'nodes' || this.view === 'arrays') {
            this.renderNodes(this.view === 'arrays');
        } else {
            this.renderEvents();
        }
    }

    private renderComponents(): void {
        const componentTree = buildComponentTree(this.snapshot.nodes, this.snapshot.edges);
        const entries = filterComponentTree(componentTree, this.search, this.kind);
        if (entries.length === 0) {
            if (componentTree.length === 0) {
                setEmptyState(
                    this.componentsEmpty,
                    'No component hierarchy',
                    'Component and host DOM hierarchy is collected only by debug/dev instrumented builds.'
                );
            } else {
                setEmptyState(this.componentsEmpty, 'No matching components', 'Change the search or kind filter to reveal the hierarchy.');
            }
            this.componentsEmpty.hidden = false;
            this.componentToolbar.hidden = true;
            this.componentList.hidden = true;
            this.componentRows.merge([]);
            this.componentRowElements.clear();
            return;
        }

        this.componentsEmpty.hidden = true;
        this.componentToolbar.hidden = false;
        this.componentList.hidden = false;
        const parentIds = new Set(entries.flatMap((entry) => (entry.parentId === undefined ? [] : [entry.parentId])));
        for (const nodeId of Array.from(this.collapsedComponentNodeIds)) {
            if (!parentIds.has(nodeId)) this.collapsedComponentNodeIds.delete(nodeId);
        }
        // Search results should never be hidden behind an old collapsed ancestor.
        const effectiveCollapsedIds = this.search.trim() === '' ? this.collapsedComponentNodeIds : new Set<string>();
        const visibleEntries = visibleComponentTree(entries, effectiveCollapsedIds);
        const componentCount = entries.filter((entry) => isComponentNode(entry.node)).length;
        const elementCount = entries.filter((entry) => isDomElementNode(entry.node)).length;
        const hiddenCount = entries.length - visibleEntries.length;
        this.componentCount.textContent = `${componentCount} component${componentCount === 1 ? '' : 's'} · ${elementCount} element${elementCount === 1 ? '' : 's'}${
            hiddenCount === 0 ? '' : ` · ${hiddenCount} collapsed`
        }`;
        this.componentExpandAllButton.disabled = this.collapsedComponentNodeIds.size === 0;
        this.componentCollapseAllButton.disabled = parentIds.size === 0 || parentIds.size === this.collapsedComponentNodeIds.size;

        const visibleEntryIds = new Set(visibleEntries.map((entry) => entry.node.id));
        if (this.focusedComponentNodeId === undefined || !visibleEntryIds.has(this.focusedComponentNodeId)) {
            this.focusedComponentNodeId =
                (this.selectedNodeId !== undefined && visibleEntryIds.has(this.selectedNodeId) ? this.selectedNodeId : undefined) ??
                visibleEntries[0]?.node.id;
        }
        const visibleIds = new Set<string>();
        const rows: Renderable[] = [];
        const siblingMetadata = componentTreeSiblingMetadata(entries);
        for (const entry of visibleEntries) {
            const node = entry.node;
            visibleIds.add(node.id);
            let rendered = this.componentRowElements.get(node.id);
            if (rendered === undefined) {
                const row = htmlElement('div', 'component-row') as HTMLDivElement;
                row.setAttribute('role', 'treeitem');
                row.dataset.nodeId = node.id;
                const disclosure = htmlElement('span', 'component-disclosure');
                disclosure.setAttribute('aria-hidden', 'true');
                const icon = htmlElement('span', 'component-icon');
                icon.setAttribute('aria-hidden', 'true');
                const label = htmlElement('span', 'component-label');
                const detail = htmlElement('span', 'component-detail');
                row.append(disclosure, icon, label, detail);
                row.addEventListener('click', (event) => {
                    const nodeId = row.dataset.nodeId;
                    if (nodeId === undefined) return;
                    this.focusedComponentNodeId = nodeId;
                    if (
                        (event.target as Element | null)?.closest('.component-disclosure') !== null &&
                        this.componentNodeHasChildren(nodeId)
                    ) {
                        this.toggleComponentNode(nodeId);
                        this.focusComponentRow(nodeId);
                        return;
                    }
                    this.selectNode(nodeId);
                });
                row.addEventListener('dblclick', (event) => {
                    const nodeId = row.dataset.nodeId;
                    if (nodeId === undefined || !this.componentNodeHasChildren(nodeId)) return;
                    event.preventDefault();
                    this.toggleComponentNode(nodeId);
                    this.focusComponentRow(nodeId);
                });
                row.addEventListener('keydown', (event) => this.handleComponentTreeKeyDown(event));
                row.addEventListener('mouseenter', () => {
                    const hoveredNode = this.snapshot.nodes.find((candidate) => candidate.id === row.dataset.nodeId);
                    if (hoveredNode !== undefined && isDomElementNode(hoveredNode)) this.highlightDomNode(hoveredNode.id, 0);
                });
                row.addEventListener('mouseleave', () => {
                    this.clearDomNodeHighlight();
                });
                row.addEventListener('focus', () => {
                    const focusedNode = this.snapshot.nodes.find((candidate) => candidate.id === row.dataset.nodeId);
                    if (focusedNode === undefined) return;
                    this.focusedComponentNodeId = focusedNode.id;
                    this.updateComponentTabStops();
                    if (isDomElementNode(focusedNode)) this.highlightDomNode(focusedNode.id, DOM_SELECTION_HIGHLIGHT_DURATION);
                });
                row.addEventListener('blur', () => {
                    this.clearDomNodeHighlight();
                });
                rendered = { row, disclosure, icon, label, detail };
                this.componentRowElements.set(node.id, rendered);
            }
            rendered.row.dataset.nodeId = node.id;
            rendered.row.style.setProperty('--tree-depth', String(entry.depth));
            rendered.row.setAttribute('aria-level', String(entry.depth + 1));
            const siblings = siblingMetadata.get(node.id);
            if (siblings !== undefined) {
                rendered.row.setAttribute('aria-posinset', String(siblings.position));
                rendered.row.setAttribute('aria-setsize', String(siblings.size));
            }
            rendered.row.tabIndex = node.id === this.focusedComponentNodeId ? 0 : -1;
            rendered.row.classList.toggle('selected', node.id === this.selectedNodeId);
            rendered.row.setAttribute('aria-selected', String(node.id === this.selectedNodeId));
            rendered.row.classList.toggle('host-node', isDomElementNode(node));
            rendered.row.classList.toggle('has-children', parentIds.has(node.id));
            rendered.row.classList.toggle('collapsed', effectiveCollapsedIds.has(node.id));
            if (parentIds.has(node.id)) {
                rendered.row.setAttribute('aria-expanded', String(!effectiveCollapsedIds.has(node.id)));
            } else {
                rendered.row.removeAttribute('aria-expanded');
            }
            rendered.disclosure.textContent = '';
            rendered.icon.textContent = isComponentNode(node) ? '◆' : '<>';
            rendered.label.textContent = node.name ?? node.id;
            rendered.detail.textContent = isComponentNode(node) ? componentDetail(node) : compactValue(node.value, 90);
            rows.push(rendered.row as unknown as Renderable);
        }
        this.componentRows.merge(rows);
        for (const nodeId of this.componentRowElements.keys()) {
            if (!visibleIds.has(nodeId)) this.componentRowElements.delete(nodeId);
        }
    }

    private filteredComponentTree(): ComponentTreeEntry[] {
        return filterComponentTree(buildComponentTree(this.snapshot.nodes, this.snapshot.edges), this.search, this.kind);
    }

    private toggleComponentNode(nodeId: string): void {
        if (this.collapsedComponentNodeIds.has(nodeId)) this.collapsedComponentNodeIds.delete(nodeId);
        else this.collapsedComponentNodeIds.add(nodeId);
        this.renderComponents();
    }

    private componentNodeHasChildren(nodeId: string): boolean {
        return this.filteredComponentTree().some((entry) => entry.parentId === nodeId);
    }

    private handleComponentTreeKeyDown(event: KeyboardEvent): void {
        const row = event.currentTarget as HTMLElement;
        const focusedNodeId = row.dataset.nodeId;
        if (focusedNodeId === undefined) return;
        if (event.key === 'Enter') {
            event.preventDefault();
            this.selectNode(focusedNodeId);
            return;
        }
        if (event.key === ' ') {
            event.preventDefault();
            const entries = this.filteredComponentTree();
            if (entries.some((entry) => entry.parentId === focusedNodeId)) this.toggleComponentNode(focusedNodeId);
            else this.selectNode(focusedNodeId);
            this.focusComponentRow(focusedNodeId);
            return;
        }
        if (!isComponentTreeNavigationKey(event.key)) return;
        event.preventDefault();
        const entries = this.filteredComponentTree();
        const effectiveCollapsedIds = this.search.trim() === '' ? this.collapsedComponentNodeIds : new Set<string>();
        const visibleEntries = visibleComponentTree(entries, effectiveCollapsedIds);
        const navigation = navigateComponentTree(entries, visibleEntries, focusedNodeId, effectiveCollapsedIds, event.key);
        if (navigation.expandId !== undefined) this.collapsedComponentNodeIds.delete(navigation.expandId);
        if (navigation.collapseId !== undefined) this.collapsedComponentNodeIds.add(navigation.collapseId);
        if (navigation.expandId !== undefined || navigation.collapseId !== undefined) this.renderComponents();
        this.focusComponentRow(navigation.focusId, true);
    }

    private focusComponentRow(nodeId: string | undefined, select = false): void {
        if (nodeId === undefined) return;
        if (select && this.selectedNodeId !== nodeId) this.selectNode(nodeId);
        const row = this.componentRowElements.get(nodeId)?.row;
        if (row === undefined) return;
        this.focusedComponentNodeId = nodeId;
        this.updateComponentTabStops();
        row.focus({ preventScroll: true });
        row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    private updateComponentTabStops(): void {
        for (const [nodeId, rendered] of this.componentRowElements) {
            rendered.row.tabIndex = nodeId === this.focusedComponentNodeId ? 0 : -1;
        }
    }

    private resetComponentTreeState(): void {
        this.focusedComponentNodeId = undefined;
        this.collapsedComponentNodeIds.clear();
        this.componentRowElements.clear();
    }

    private renderGraph(): void {
        const filteredNodes = filterNodes(this.snapshot.nodes, this.search, this.kind);
        if (filteredNodes.length === 0) {
            setEmptyState(this.graphEmpty, 'No matching nodes', 'Change the search or kind filter to see more of the graph.');
            this.graphEmpty.hidden = false;
            this.graphLimit.hidden = true;
            setElementHidden(this.graphSvg, true);
            this.graphEdges.merge([]);
            this.graphNodes.merge([]);
            this.graphEdgeElements.clear();
            this.graphNodeElements.clear();
            return;
        }

        this.graphEmpty.hidden = true;
        setElementHidden(this.graphSvg, false);
        const visibleNodes = filteredNodes.slice(0, MAXIMUM_GRAPH_NODES);
        const visibleIds = new Set(visibleNodes.map((node) => node.id));
        const layout = layoutGraph(
            visibleNodes,
            this.snapshot.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
        );
        const positionById = new Map(layout.nodes.map((position) => [position.node.id, position]));
        const relatedNodes = relatedGraphNodeIds(this.selectedNodeId, layout.edges);
        if (filteredNodes.length > visibleNodes.length) {
            this.graphLimit.hidden = false;
            this.graphLimit.textContent = `Showing ${visibleNodes.length} of ${filteredNodes.length} matching nodes. Narrow the filter to inspect the rest.`;
        } else {
            this.graphLimit.hidden = true;
        }

        this.graphSvg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
        this.graphSvg.setAttribute('width', String(layout.width));
        this.graphSvg.setAttribute('height', String(layout.height));

        const edgeKeys = new Set<string>();
        const edgeElements: Renderable[] = [];
        for (let index = 0; index < layout.edges.length; index++) {
            const edge = layout.edges[index];
            const source = positionById.get(edge.source);
            const target = positionById.get(edge.target);
            if (source === undefined || target === undefined) {
                continue;
            }
            const key = graphEdgeKey(edge);
            edgeKeys.add(key);
            let rendered = this.graphEdgeElements.get(key);
            if (rendered === undefined) {
                const path = document.createElementNS(SVG_NAMESPACE, 'path');
                path.setAttribute('marker-end', 'url(#arrow)');
                const title = document.createElementNS(SVG_NAMESPACE, 'title');
                path.append(title);
                rendered = { path, title };
                this.graphEdgeElements.set(key, rendered);
            }
            const startX = source.x + source.width;
            const startY = source.y + source.height / 2;
            const endX = target.x;
            const endY = target.y + target.height / 2;
            const bend = Math.max(30, Math.abs(endX - startX) / 2);
            rendered.path.setAttribute(
                'd',
                `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`
            );
            rendered.path.classList.toggle('upstream', edge.target === this.selectedNodeId);
            rendered.path.classList.toggle('downstream', edge.source === this.selectedNodeId);
            rendered.title.textContent = edge.label ?? edge.kind ?? `${edge.source} → ${edge.target}`;
            edgeElements.push(rendered.path as unknown as Renderable);
        }
        this.graphEdges.merge(edgeElements);
        for (const key of this.graphEdgeElements.keys()) {
            if (!edgeKeys.has(key)) this.graphEdgeElements.delete(key);
        }

        const nodeIds = new Set<string>();
        const nodeElements: Renderable[] = [];
        for (const positioned of layout.nodes) {
            const nodeId = positioned.node.id;
            nodeIds.add(nodeId);
            let rendered = this.graphNodeElements.get(nodeId);
            if (rendered === undefined) {
                const group = document.createElementNS(SVG_NAMESPACE, 'g');
                group.classList.add('graph-node');
                group.setAttribute('data-node-id', nodeId);
                group.setAttribute('tabindex', '0');
                group.setAttribute('role', 'button');
                group.addEventListener('mouseenter', () => {
                    this.hoveredGraphNodeId = nodeId;
                    this.highlightDomNode(nodeId, 0);
                });
                group.addEventListener('mouseleave', () => {
                    if (this.hoveredGraphNodeId === nodeId) {
                        this.hoveredGraphNodeId = undefined;
                        this.clearDomNodeHighlight();
                    }
                });
                group.addEventListener('focus', () => this.highlightDomNode(nodeId, DOM_SELECTION_HIGHLIGHT_DURATION));
                group.addEventListener('blur', () => this.clearDomNodeHighlight());
                group.addEventListener('click', () => this.selectNode(nodeId));
                group.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        this.selectNode(nodeId);
                    }
                });
                const rectangle = document.createElementNS(SVG_NAMESPACE, 'rect');
                rectangle.setAttribute('width', String(positioned.width));
                rectangle.setAttribute('height', String(positioned.height));
                rectangle.setAttribute('rx', '7');
                const title = svgText(10, 19, '', 'graph-node-title');
                const value = svgText(10, 37, '', 'graph-node-value');
                const subscriptions = svgText(positioned.width - 10, 51, '', 'graph-node-subscriptions');
                subscriptions.setAttribute('text-anchor', 'end');
                group.append(rectangle, title, value, subscriptions);
                rendered = { group, title, value, subscriptions };
                this.graphNodeElements.set(nodeId, rendered);
            }
            const { group, title, value, subscriptions } = rendered;
            if (this.flashingNodeIds.has(positioned.node.id)) {
                group.classList.add('updated');
            } else {
                group.classList.remove('updated');
            }
            group.classList.toggle('selected', positioned.node.id === this.selectedNodeId);
            group.classList.toggle('upstream', relatedNodes.upstream.has(positioned.node.id));
            group.classList.toggle('downstream', relatedNodes.downstream.has(positioned.node.id));
            group.setAttribute('transform', `translate(${positioned.x} ${positioned.y})`);
            title.textContent = nodeLabel(positioned.node);
            value.textContent =
                positioned.node.value === undefined
                    ? this.status.mode === 'production'
                        ? 'Not captured'
                        : `version ${positioned.node.version ?? 0} · select to inspect`
                    : compactValue(positioned.node.value, 27);
            subscriptions.textContent = `${positioned.node.subscriberCount} sub${positioned.node.subscriberCount === 1 ? '' : 's'}`;
            nodeElements.push(group as unknown as Renderable);
        }
        this.graphNodes.merge(nodeElements);
        for (const nodeId of this.graphNodeElements.keys()) {
            if (!nodeIds.has(nodeId)) this.graphNodeElements.delete(nodeId);
        }
    }

    private renderNodes(arrayOnly = false): void {
        const nodes = filterNodes(this.snapshot.nodes, this.search, arrayOnly ? '' : this.kind)
            .filter((node) => !arrayOnly || isArrayDataSourceNode(node))
            .sort((left, right) =>
            nodeLabel(left).localeCompare(nodeLabel(right))
        );
        if (nodes.length === 0) {
            this.nodesEmpty.hidden = false;
            this.nodeSurface.hidden = true;
            this.nodeRows.merge([]);
            this.nodeRowElements.clear();
            return;
        }

        this.nodesEmpty.hidden = true;
        this.nodeSurface.hidden = false;
        const page = paginateItems(nodes, this.nodePage, NODE_PAGE_SIZE);
        this.nodePage = page.page;
        this.nodeRange.textContent =
            page.total === 0
                ? `0 ${arrayOnly ? 'arrays' : 'nodes'}`
                : `${page.start + 1}–${page.end} of ${page.total} ${arrayOnly ? 'arrays' : 'nodes'} · page ${page.page + 1} of ${page.pageCount}`;
        this.nodePreviousButton.disabled = page.page === 0;
        this.nodeNextButton.disabled = page.page >= page.pageCount - 1;

        const visibleIds = new Set<string>();
        const rows: Renderable[] = [];
        for (const node of page.items) {
            visibleIds.add(node.id);
            let rendered = this.nodeRowElements.get(node.id);
            if (rendered === undefined) {
                const row = document.createElement('tr');
                row.tabIndex = 0;
                row.addEventListener('click', () => this.selectNode(node.id));
                row.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        this.selectNode(node.id);
                    }
                });
                const name = tableCell('', 'node-name');
                const kind = tableCell('', 'kind-cell');
                const value = tableCell('', 'value-cell');
                const version = tableCell('');
                const subscriptions = tableCell('', 'numeric-cell');
                row.append(name, kind, value, version, subscriptions);
                rendered = { row, name, kind, value, version, subscriptions };
                this.nodeRowElements.set(node.id, rendered);
            }
            const { row, name, kind, value, version, subscriptions } = rendered;
            row.classList.toggle('selected', node.id === this.selectedNodeId);
            name.textContent = node.name ?? node.id;
            kind.textContent = node.kind;
            value.textContent =
                node.value === undefined
                    ? this.status.mode === 'production'
                        ? 'Not captured'
                        : 'Select to inspect'
                    : compactValue(node.value, 100);
            version.textContent = node.version === undefined ? '—' : String(node.version);
            subscriptions.textContent = String(node.subscriberCount);
            rows.push(row as unknown as Renderable);
        }
        this.nodeRows.merge(rows);
        for (const nodeId of this.nodeRowElements.keys()) {
            if (!visibleIds.has(nodeId)) this.nodeRowElements.delete(nodeId);
        }
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
            this.eventsEmpty.hidden = false;
            this.eventList.hidden = true;
            this.eventItems.merge([]);
            this.eventItemElements.clear();
            return;
        }

        this.eventsEmpty.hidden = true;
        this.eventList.hidden = false;
        const visibleIds = new Set<string>();
        const items: Renderable[] = [];
        for (const event of events) {
            visibleIds.add(event.id);
            let rendered = this.eventItemElements.get(event.id);
            if (rendered === undefined) {
                const item = htmlElement('li', 'event-item');
                item.dataset.eventId = event.id;
                const heading = htmlElement('div', 'event-heading');
                const time = htmlElement('time', 'event-time');
                const type = htmlElement('span', 'event-type');
                const node = htmlElement('span', 'event-node');
                const description = htmlElement('span', 'event-description');
                heading.append(time, type, node, description);
                const details = htmlElement('pre', 'event-details');
                item.append(heading, details);
                rendered = { item, time, type, node, description, details };
                item.addEventListener('click', () => {
                    if (rendered?.relatedNodeId !== undefined) this.selectNode(rendered.relatedNodeId);
                });
                this.eventItemElements.set(event.id, rendered);
            }
            const { item, time, type, node, description, details } = rendered;
            time.textContent = formatTime(event.timestamp);
            type.className = `event-type event-${event.type}`;
            type.textContent = event.type;
            node.textContent = event.nodeId ?? event.edgeId ?? 'runtime';
            const eventNode = event.nodeId === undefined ? undefined : this.snapshot.nodes.find((candidate) => candidate.id === event.nodeId);
            const arrayMutation = eventNode !== undefined && isArrayDataSourceNode(eventNode) ? arrayMutationDescription(event) : undefined;
            const detailParts = [
                arrayMutation ?? event.updateKind,
                event.channel === undefined ? undefined : `${event.channel}: ${event.count ?? '?'}`,
                event.value === undefined ? undefined : compactValue(event.value, 180)
            ].filter((part): part is string => part !== undefined);
            description.hidden = detailParts.length === 0;
            description.textContent = detailParts.join(' · ');
            details.hidden = event.details === undefined;
            details.textContent = event.details === undefined ? '' : detailedValue(event.details);

            const relatedEdge =
                event.edgeId === undefined ? undefined : this.snapshot.edges.find((edge) => edge.id === event.edgeId);
            const relatedNodeId = event.nodeId ?? event.sourceId ?? event.targetId ?? relatedEdge?.source ?? relatedEdge?.target;
            rendered.relatedNodeId =
                relatedNodeId !== undefined && this.snapshot.nodes.some((candidate) => candidate.id === relatedNodeId)
                    ? relatedNodeId
                    : undefined;
            item.classList.toggle('selectable', rendered.relatedNodeId !== undefined);
            items.push(item as unknown as Renderable);
        }
        this.eventItems.merge(items);
        for (const eventId of this.eventItemElements.keys()) {
            if (!visibleIds.has(eventId)) this.eventItemElements.delete(eventId);
        }
    }

    private renderDetails(): void {
        const previousScrollTop = this.details.scrollTop;
        clear(this.details);
        const node = this.snapshot.nodes.find((candidate) => candidate.id === this.selectedNodeId);
        if (node === undefined) {
            this.details.append(emptyState('Select a node', 'Node values, subscriptions, relationships, and debug metadata appear here.'));
            this.details.scrollTop = previousScrollTop;
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

        if (
            this.status.mode === 'debug' &&
            this.status.capabilities.includes('update-breakpoints') &&
            isDataSourceNode(detailedNode)
        ) {
            const breakpointEnabled = detailedNode.breakOnUpdate === true;
            const breakpointButton = htmlElement(
                'button',
                `breakpoint-button${breakpointEnabled ? ' active' : ''}`,
                breakpointEnabled ? 'Break on updates: on' : 'Break on updates'
            ) as HTMLButtonElement;
            breakpointButton.type = 'button';
            breakpointButton.disabled = this.breakpointRequests.has(node.id);
            breakpointButton.setAttribute('aria-pressed', String(breakpointEnabled));
            breakpointButton.title = breakpointEnabled
                ? 'Disable the debugger breakpoint for this DataSource'
                : 'Pause JavaScript at the synchronous mutation that updates this DataSource';
            breakpointButton.addEventListener('click', () => {
                void this.toggleUpdateBreakpoint(node.id, !breakpointEnabled);
            });
            const breakpointActions = htmlElement('div', 'details-actions');
            breakpointActions.append(breakpointButton);
            this.details.append(breakpointActions);
        }

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

        if (isArrayDataSourceNode(detailedNode)) {
            const preview = arrayPreview(detailedNode.value);
            if (preview !== undefined) {
                const items = htmlElement('div', 'array-items');
                for (const item of preview.items) {
                    const row = htmlElement('div', 'array-item');
                    row.append(
                        htmlElement('span', 'array-index', item.index),
                        htmlElement('code', 'array-value', compactValue(item.value, 160))
                    );
                    items.append(row);
                }
                if (preview.items.length === 0) items.append(htmlElement('span', 'empty-inline', 'Empty array'));
                if (preview.truncated) items.append(htmlElement('span', 'array-truncated', 'Preview truncated'));
                this.details.append(detailContainer(`Array items (${preview.size})`, items));
            }
        }

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
        this.details.scrollTop = previousScrollTop;
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
        if (this.view === 'components') this.revealComponentNode(nodeId);
        this.renderContent();
        this.renderDetails();
        this.highlightDomNode(nodeId, DOM_SELECTION_HIGHLIGHT_DURATION);
        void this.inspectSelectedNode(nodeId);
    }

    private async toggleUpdateBreakpoint(nodeId: string, enabled: boolean): Promise<void> {
        if (this.breakpointRequests.has(nodeId)) return;
        this.breakpointRequests.add(nodeId);
        this.renderDetails();
        const generation = this.bridgeGeneration;
        try {
            const result = await this.bridge.setUpdateBreakpoint(nodeId, enabled);
            if (result === undefined || generation !== this.bridgeGeneration || this.disposed) return;
            const node = this.snapshot.nodes.find((candidate) => candidate.id === nodeId);
            if (node !== undefined) {
                if (result) node.breakOnUpdate = true;
                else delete node.breakOnUpdate;
            }
            if (this.selectedNodeId === nodeId) {
                this.selectedInspection = undefined;
                this.inspectionRevision = undefined;
            }
            this.renderedRevision = undefined;
        } finally {
            this.breakpointRequests.delete(nodeId);
            this.renderDetails();
        }
        await this.refresh();
    }

    private revealComponentNode(nodeId: string): void {
        const entries = this.filteredComponentTree();
        const byId = new Map(entries.map((entry) => [entry.node.id, entry]));
        const visited = new Set<string>();
        let parentId = byId.get(nodeId)?.parentId;
        while (parentId !== undefined && !visited.has(parentId)) {
            visited.add(parentId);
            this.collapsedComponentNodeIds.delete(parentId);
            parentId = byId.get(parentId)?.parentId;
        }
    }

    private flashUpdatedNodes(events: readonly DevtoolsEvent[]): void {
        for (const nodeId of updatedNodeIds(events)) {
            this.flashingNodeIds.add(nodeId);
            const graphNode = this.graphNodeElements.get(nodeId)?.group;
            if (graphNode?.isConnected) {
                graphNode.classList.remove('updated');
                void graphNode.getBoundingClientRect();
                graphNode.classList.add('updated');
            }
            const previousTimer = this.nodeFlashTimers.get(nodeId);
            if (previousTimer !== undefined) window.clearTimeout(previousTimer);
            const timer = window.setTimeout(() => {
                if (this.nodeFlashTimers.get(nodeId) !== timer) return;
                this.nodeFlashTimers.delete(nodeId);
                this.flashingNodeIds.delete(nodeId);
                for (const element of this.content.querySelectorAll('.graph-node.updated')) {
                    if (element.getAttribute('data-node-id') === nodeId) element.classList.remove('updated');
                }
            }, NODE_UPDATE_FLASH_DURATION);
            this.nodeFlashTimers.set(nodeId, timer);
        }
    }

    private clearNodeUpdateFlashes(): void {
        for (const timer of this.nodeFlashTimers.values()) window.clearTimeout(timer);
        this.nodeFlashTimers.clear();
        this.flashingNodeIds.clear();
    }

    private highlightDomNode(nodeId: string, duration: number): void {
        if (!this.status.capabilities.includes('dom-highlighting')) return;
        void this.bridge.highlightDomNode(nodeId, duration).catch((_error: unknown): undefined => undefined);
    }

    private clearDomNodeHighlight(): void {
        if (!this.status.capabilities.includes('dom-highlighting')) return;
        void this.bridge.clearDomNodeHighlight().catch((_error: unknown): undefined => undefined);
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

function graphEdgeKey(edge: DevtoolsSnapshot['edges'][number]): string {
    return edge.id ?? `${edge.source}\u0000${edge.target}\u0000${edge.kind ?? ''}\u0000${edge.label ?? ''}`;
}

function componentTreeSiblingMetadata(entries: readonly ComponentTreeEntry[]): Map<string, { position: number; size: number }> {
    const groups = new Map<string, ComponentTreeEntry[]>();
    for (const entry of entries) {
        const key = entry.parentId ?? '';
        const siblings = groups.get(key) ?? [];
        siblings.push(entry);
        groups.set(key, siblings);
    }
    const result = new Map<string, { position: number; size: number }>();
    for (const siblings of groups.values()) {
        for (let index = 0; index < siblings.length; index++) {
            result.set(siblings[index].node.id, { position: index + 1, size: siblings.length });
        }
    }
    return result;
}

function componentDetail(node: DevtoolsNode): string {
    if (typeof node.value !== 'object' || node.value === null) return 'Component';
    const entries = (node.value as { entries?: unknown }).entries;
    if (!Array.isArray(entries)) return 'Component';
    const childCountEntry = entries.find(
        (entry) => typeof entry === 'object' && entry !== null && (entry as { key?: unknown }).key === 'childCount'
    ) as { value?: unknown } | undefined;
    const childCount = previewScalar(childCountEntry?.value);
    return childCount === undefined ? 'Component' : `${childCount} JSX child${childCount === '1' ? '' : 'ren'}`;
}

function isComponentTreeNavigationKey(key: string): key is ComponentTreeNavigationKey {
    return key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'End' || key === 'Home';
}

function emptyState(title: string, description: string): HTMLElement {
    const result = htmlElement('div', 'empty-state');
    result.append(htmlElement('strong', '', title), htmlElement('span', '', description));
    return result;
}

function setEmptyState(element: HTMLElement, title: string, description: string): void {
    const heading = element.querySelector('strong');
    const body = element.querySelector('span');
    if (heading !== null) heading.textContent = title;
    if (body !== null) body.textContent = description;
}

function setElementHidden(element: Element, hidden: boolean): void {
    if (hidden) element.setAttribute('hidden', '');
    else element.removeAttribute('hidden');
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

function arrayMutationDescription(event: DevtoolsEvent): string | undefined {
    const details = typeof event.details === 'object' && event.details !== null ? (event.details as Record<string, unknown>) : undefined;
    const operation = event.updateKind ?? previewScalar(details?.operation);
    if (operation === undefined) return undefined;
    const index = previewScalar(details?.index);
    const index2 = previewScalar(details?.index2);
    const count = previewScalar(details?.count);
    return [operation, index === undefined ? undefined : `index ${index}`, index2 === undefined ? undefined : `to ${index2}`, count === undefined ? undefined : `count ${count}`]
        .filter((part): part is string => part !== undefined)
        .join(' · ');
}

function previewScalar(value: unknown): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value !== 'object' || value === null) return undefined;
    const preview = value as { value?: unknown; summary?: unknown };
    if (typeof preview.value === 'string' || typeof preview.value === 'number' || typeof preview.value === 'boolean') {
        return String(preview.value);
    }
    return typeof preview.summary === 'string' ? preview.summary : undefined;
}

const root = document.querySelector<HTMLElement>('#app');
if (root === null) {
    throw new Error('Aurum DevTools panel could not find its root element');
}
const panel = new AurumDevtoolsPanel(root);
window.__AURUM_DEVTOOLS_PANEL__ = { setVisible: (visible) => panel.setVisible(visible) };
