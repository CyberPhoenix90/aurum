import { afterEach, describe, expect, it } from 'vitest';
import type { AurumDevtoolsEvent } from '../src/index.js';
import {
    AURUM_DEVTOOLS_GLOBAL_KEY,
    AURUM_DEVTOOLS_PROTOCOL_VERSION,
    AURUM_DEVTOOLS_SYMBOL,
    ArrayDataSource,
    CancellationToken,
    Channel,
    configureAurumDevtools,
    DataSource,
    DuplexDataSource,
    emitAurumDevtoolsUpdate,
    getAurumDevtoolsRegistry,
    isAurumDevtoolsRegistry,
    linkAurumDevtoolsNodes,
    MapDataSource,
    ObjectDataSource,
    previewAurumDevtoolsValue,
    registerAurumDevtoolsNode,
    resolveAurumDevtoolsNodeId,
    setAurumDevtoolsUpdateBreakpoint,
    setAurumDevtoolsSubscriptionCount,
    SetDataSource,
    TreeDataSource,
    unregisterAurumDevtoolsNode
} from '../src/index.js';

const cleanupTargets: object[] = [];

afterEach(() => {
    for (const target of cleanupTargets.splice(0)) unregisterAurumDevtoolsNode(target);
    const registry = configureAurumDevtools({ mode: 'production', historyLimit: 0, captureStacks: false });
    registry.clearHistory();
});

describe('Aurum developer tools protocol', () => {
    it('exposes one typed registry and limits page-global discovery to browsers', () => {
        const registry = getAurumDevtoolsRegistry();
        const page = globalThis as unknown as Record<PropertyKey, unknown>;

        if (page.window === globalThis && typeof page.document === 'object') {
            expect(page[AURUM_DEVTOOLS_GLOBAL_KEY]).toBe(registry);
            expect(page[AURUM_DEVTOOLS_SYMBOL]).toBe(registry);
        } else {
            expect(page[AURUM_DEVTOOLS_GLOBAL_KEY]).not.toBe(registry);
            expect(page[AURUM_DEVTOOLS_SYMBOL]).not.toBe(registry);
        }
        expect(registry.protocolVersion).toBe(AURUM_DEVTOOLS_PROTOCOL_VERSION);
        expect(Object.isFrozen(registry)).toBe(true);
        expect(Object.isFrozen(registry.config)).toBe(true);
        expect('nodes' in (registry as object)).toBe(false);
        expect('getEntry' in (registry as object)).toBe(false);
        expect(registry.runtimeId).toMatch(/^aurum:/);
        expect(registry.getSnapshot().runtimeId).toBe(registry.runtimeId);
        expect(registry.getSnapshot().revision).toBe(registry.revision);
        expect(registry.capabilities).toContain('graph');
        expect(registry.capabilities).toContain('inspect');
        expect(registry.capabilities).toContain('subscriptions');
        expect(registry.capabilities).toContain('array-data-sources');
        expect(registry.getSnapshot().protocolVersion).toBe(AURUM_DEVTOOLS_PROTOCOL_VERSION);
    });

    it('owns a stable runtime id and advances revision only for inspector-visible changes', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 10 });
        const runtimeId = registry.runtimeId;
        const target = {};
        const initialRevision = registry.revision;
        cleanupTargets.push(target);

        registerAurumDevtoolsNode(target, { kind: 'revision-test' });
        const registeredRevision = registry.revision;
        expect(registeredRevision).toBeGreaterThan(initialRevision);
        expect(registry.getSnapshot().revision).toBe(registeredRevision);
        expect(registry.getSnapshot().revision).toBe(registeredRevision);

        emitAurumDevtoolsUpdate(target);
        expect(registry.revision).toBeGreaterThan(registeredRevision);
        expect(registry.runtimeId).toBe(runtimeId);
        expect(getAurumDevtoolsRegistry().runtimeId).toBe(runtimeId);
    });

    it('omits absent optional fields from snapshots and cloned events', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 10 });
        const target = {};
        cleanupTargets.push(target);

        const id = registerAurumDevtoolsNode(target, { kind: 'minimal-node' });
        const node = registry.inspect(id)!;
        const added = registry.getSnapshot().events.find((event) => event.type === 'node-added')!;

        expect(node).not.toHaveProperty('name');
        expect(node).not.toHaveProperty('value');
        expect(node).not.toHaveProperty('metadata');
        expect(node).not.toHaveProperty('creationStack');
        expect(added).not.toHaveProperty('value');
        expect(added).not.toHaveProperty('details');
    });

    it('rejects incomplete and hostile registry-shaped globals without invoking unsafe getters', () => {
        const registry = getAurumDevtoolsRegistry();
        expect(isAurumDevtoolsRegistry(registry)).toBe(true);
        expect(isAurumDevtoolsRegistry({ protocolVersion: AURUM_DEVTOOLS_PROTOCOL_VERSION })).toBe(false);

        const hostile = new Proxy(
            {},
            {
                get: () => {
                    throw new Error('hostile getter');
                }
            }
        );
        expect(() => isAurumDevtoolsRegistry(hostile)).not.toThrow();
        expect(isAurumDevtoolsRegistry(hostile)).toBe(false);
        expect(() => configureAurumDevtools(hostile as never)).not.toThrow();
    });

    it('registers rich debug nodes and evaluates values only when inspected', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: true, historyLimit: 20 });
        let reads = 0;
        const target = { current: { answer: 42 } };
        cleanupTargets.push(target);

        const id = registerAurumDevtoolsNode(target, {
            kind: 'test-node',
            name: 'answer',
            getValue: (node) => {
                reads++;
                return node.current;
            },
            metadata: { purpose: 'test' }
        });

        expect(reads).toBe(0);
        registry.getSnapshot({ includeValues: false });
        expect(reads).toBe(0);
        expect(resolveAurumDevtoolsNodeId(target)).toBe(id);
        const node = registry.inspect(id)!;
        expect(reads).toBe(1);
        expect(node).toMatchObject({ id, kind: 'test-node', name: 'answer', version: 0 });
        expect(node.value?.entries?.find((entry) => entry.key === 'answer')?.value.value).toBe(42);
        expect(node.metadata?.purpose.value).toBe('test');
        expect(node.creationStack).toBeTypeOf('string');
        expect(registry.capabilities).toContain('annotations');
        expect(registry.capabilities).toContain('component-tree');
    });

    it('returns detached snapshot previews and isolated live events', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 10 });
        const target = {};
        let observedEvent: AurumDevtoolsEvent | undefined;
        cleanupTargets.push(target);
        registerAurumDevtoolsNode(target, { kind: 'isolation-test', metadata: { label: 'original metadata' } });

        const stopMutator = registry.subscribe((event) => {
            if (event.updateKind !== 'isolation-update') return;
            (event as { updateKind?: string }).updateKind = 'mutated update';
            if (event.value?.entries?.[0]) event.value.entries[0].value.summary = 'mutated live preview';
        });
        const stopObserver = registry.subscribe((event) => {
            if (event.updateKind === 'isolation-update') observedEvent = event;
        });

        emitAurumDevtoolsUpdate(target, { kind: 'isolation-update', value: { secret: 'original value' } });
        expect(observedEvent?.updateKind).toBe('isolation-update');
        expect(observedEvent?.value?.entries?.[0].value.value).toBe('original value');

        const firstNode = registry.inspect(target)!;
        firstNode.metadata!.label.summary = 'mutated metadata';
        firstNode.value!.entries![0].value.summary = 'mutated node preview';
        const firstHistoryEvent = registry.getSnapshot().events.find((event) => event.updateKind === 'isolation-update')!;
        firstHistoryEvent.value!.entries![0].value.summary = 'mutated history preview';

        const secondNode = registry.inspect(target)!;
        const secondHistoryEvent = registry.getSnapshot().events.find((event) => event.updateKind === 'isolation-update')!;
        expect(secondNode.metadata?.label.summary).toBe('"original metadata"');
        expect(secondNode.value?.entries?.[0].value.summary).toBe('"original value"');
        expect(secondHistoryEvent.value?.entries?.[0].value.summary).toBe('"original value"');
        stopMutator();
        stopObserver();
    });

    it('redacts an update if previewing it re-enters production mode', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 10 });
        const target = {};
        const events: AurumDevtoolsEvent[] = [];
        cleanupTargets.push(target);
        registerAurumDevtoolsNode(target, { kind: 'reentrant-redaction' });
        const unsubscribe = registry.subscribe((event) => events.push(event));
        const value = Object.create(null) as Record<string, unknown>;
        Object.defineProperty(value, 'secret', {
            enumerable: true,
            get: () => {
                configureAurumDevtools({ mode: 'production', captureStacks: true, historyLimit: 10 });
                return 'VALUE_SECRET';
            }
        });

        emitAurumDevtoolsUpdate(target, { kind: 'reentrant-update', value, details: { secret: 'DETAIL_SECRET' } });
        const update = events.find((event) => event.updateKind === 'reentrant-update');
        expect(registry.mode).toBe('production');
        expect(update?.value).toBeUndefined();
        expect(update?.details).toBeUndefined();
        expect(JSON.stringify(registry.getSnapshot())).not.toContain('SECRET');
        unsubscribe();
    });

    it('tracks scalar updates, errors, and the exact live subscription count', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 30 });
        const source = new DataSource(1, 'counter');
        cleanupTargets.push(source);
        const id = resolveAurumDevtoolsNodeId(source)!;
        const token = new CancellationToken();

        source.listen(() => undefined, token);
        source.onError(() => undefined, token);
        expect(registry.inspect(id)?.subscriptions).toEqual({ updates: 1, errors: 1 });

        source.update(2);
        source.emitError(new Error('expected'));
        expect(registry.inspect(id)).toMatchObject({ kind: 'data-source', name: 'counter', version: 2 });
        expect(registry.inspect(id)?.value?.value).toBe(2);
        expect(registry.getSnapshot().events.some((event) => event.nodeId === id && event.updateKind === 'update')).toBe(true);
        expect(registry.getSnapshot().events.some((event) => event.nodeId === id && event.updateKind === 'error')).toBe(true);

        token.cancel();
        expect(registry.inspect(id)?.subscriptions).toEqual({ updates: 0, errors: 0 });
    });

    it('arms persistent update breakpoints only in debug mode', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 20 });
        const source = new DataSource(1, 'breakpoint source');
        cleanupTargets.push(source);
        const id = resolveAurumDevtoolsNodeId(source)!;

        expect(registry.capabilities).toContain('update-breakpoints');
        expect(setAurumDevtoolsUpdateBreakpoint(source, true)).toBe(true);
        expect(registry.inspect(id)?.breakOnUpdate).toBe(true);
        const events = registry.getSnapshot().events;
        expect(events[events.length - 1]).toMatchObject({
            nodeId: id,
            updateKind: 'breakpoint-enabled'
        });

        source.update(2);
        expect(registry.inspect(id)).toMatchObject({ version: 1, breakOnUpdate: true });
        expect(setAurumDevtoolsUpdateBreakpoint(id, false)).toBe(false);
        expect(registry.inspect(id)?.breakOnUpdate).toBeUndefined();

        configureAurumDevtools({ mode: 'production' });
        expect(registry.capabilities).not.toContain('update-breakpoints');
        expect(setAurumDevtoolsUpdateBreakpoint(source, true)).toBe(false);
        expect(registry.inspect(id)?.breakOnUpdate).toBeUndefined();
    });

    it('tracks one-time subscriptions when they fire or are cancelled', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 10 });
        const source = new DataSource(1);
        cleanupTargets.push(source);
        const id = resolveAurumDevtoolsNodeId(source)!;

        source.listenOnce(() => undefined);
        expect(registry.inspect(id)?.subscriptions.updates).toBe(1);
        source.update(2);
        expect(registry.inspect(id)?.subscriptions.updates).toBe(0);

        const token = new CancellationToken();
        source.listenOnce(() => undefined, token);
        expect(registry.inspect(id)?.subscriptions.updates).toBe(1);
        token.cancel();
        expect(registry.inspect(id)?.subscriptions.updates).toBe(0);
    });

    it('records transformation graphs and removes lifetime-bound edges', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 30 });
        const token = new CancellationToken();
        const source = new ArrayDataSource([1, 2, 3], 'numbers');
        const mapped = source.map((value) => value * 2, [], token) as ArrayDataSource<number>;
        cleanupTargets.push(source, source.length, mapped, mapped.length);

        const sourceId = resolveAurumDevtoolsNodeId(source)!;
        const mappedId = resolveAurumDevtoolsNodeId(mapped)!;
        const edge = registry.getSnapshot().edges.find((item) => item.source === sourceId && item.target === mappedId);
        expect(edge).toMatchObject({ kind: 'transform', label: 'map' });
        expect(registry.inspect(mappedId)).toMatchObject({ kind: 'array-view', name: 'numbers.map()' });

        token.cancel();
        expect(registry.getSnapshot().edges.find((item) => item.id === edge!.id)).toBeUndefined();
    });

    it('retain-counts repeated registrations with independent lifetimes', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 20 });
        const firstLifetime = new CancellationToken();
        const secondLifetime = new CancellationToken();
        const target = {};

        const firstId = registerAurumDevtoolsNode(target, { kind: 'shared', name: 'first owner' }, firstLifetime);
        const secondId = registerAurumDevtoolsNode(target, { kind: 'shared', name: 'second owner' }, secondLifetime);
        expect(secondId).toBe(firstId);

        firstLifetime.cancel();
        expect(registry.inspect(firstId)).toBeDefined();
        expect(resolveAurumDevtoolsNodeId(target)).toBe(firstId);

        secondLifetime.cancel();
        expect(registry.inspect(firstId)).toBeUndefined();
        expect(resolveAurumDevtoolsNodeId(target)).toBeUndefined();
    });

    it('covers combination, collection lens, dynamic item, tree-child, and per-key graph details', () => {
        type Node = { id: string; children: Node[] | ArrayDataSource<Node> };
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 200 });
        const graphLifetime = new CancellationToken();
        const scalarA = new DataSource(1, 'a');
        const scalarB = new DataSource(2, 'b');
        const scalarCombination = DataSource.fromMultipleSources([scalarA, scalarB], graphLifetime);

        const array = new ArrayDataSource([1, 2], 'array');
        const picked = array.pickAt(1, graphLifetime);
        const setView = array.toSetDataSource(graphLifetime) as SetDataSource<number>;
        const left = new ArrayDataSource([1], 'left');
        const right = new ArrayDataSource([2], 'right');
        const arrayCombination = ArrayDataSource.fromMultipleSources([left, right], graphLifetime) as ArrayDataSource<number>;
        const dynamicParent = new ArrayDataSource<DataSource<number>>([scalarA, scalarB]);
        const dynamicResult = ArrayDataSource.DynamicArrayDataSourceToArrayDataSource(dynamicParent, graphLifetime) as ArrayDataSource<number>;

        const mapA = new MapDataSource(new Map([['a', 1]]));
        const mapB = new MapDataSource(new Map([['b', 2]]));
        const mapCombination = MapDataSource.fromMultipleMaps([mapA, mapB], graphLifetime);

        const root: Node = { id: 'root', children: [{ id: 'child', children: [] }] };
        const roots = new ArrayDataSource<Node>([root]);
        const tree = new TreeDataSource<Node, 'children'>('children', roots);
        const childCollection = tree.getChildren(root) as ArrayDataSource<Node>;
        const leafCollection = tree.getChildren(childCollection.get(0)) as ArrayDataSource<Node>;

        const keyLifetime = new CancellationToken();
        mapA.listenOnKey('watched', () => undefined, keyLifetime);
        setView.listenOnKey(2, () => undefined, keyLifetime);

        cleanupTargets.push(
            scalarA,
            scalarB,
            scalarCombination,
            array,
            array.length,
            picked as object,
            setView,
            left,
            left.length,
            right,
            right.length,
            arrayCombination,
            arrayCombination.length,
            dynamicParent,
            dynamicParent.length,
            dynamicResult,
            dynamicResult.length,
            mapA,
            mapB,
            mapCombination,
            roots,
            roots.length,
            tree,
            childCollection,
            childCollection.length,
            leafCollection,
            leafCollection.length
        );

        const snapshot = registry.getSnapshot({ includeValues: false });
        const hasEdge = (source: object, target: object, kind: string, label?: string): boolean => {
            const sourceId = resolveAurumDevtoolsNodeId(source);
            const targetId = resolveAurumDevtoolsNodeId(target);
            return snapshot.edges.some(
                (edge) => edge.source === sourceId && edge.target === targetId && edge.kind === kind && (label === undefined || edge.label === label)
            );
        };

        expect(hasEdge(scalarA, scalarCombination, 'combine')).toBe(true);
        expect(hasEdge(scalarB, scalarCombination, 'combine')).toBe(true);
        expect(hasEdge(array, picked as object, 'derived', 'index 1')).toBe(true);
        expect(hasEdge(array, setView, 'transform', 'toSetDataSource')).toBe(true);
        expect(hasEdge(left, arrayCombination, 'combine', 'source 0')).toBe(true);
        expect(hasEdge(right, arrayCombination, 'combine', 'source 1')).toBe(true);
        expect(hasEdge(dynamicParent, dynamicResult, 'transform', 'unwrap sources')).toBe(true);
        expect(hasEdge(scalarA, dynamicResult, 'dynamic-item')).toBe(true);
        expect(hasEdge(scalarB, dynamicResult, 'dynamic-item')).toBe(true);
        expect(hasEdge(mapA, mapCombination, 'combine')).toBe(true);
        expect(hasEdge(mapB, mapCombination, 'combine')).toBe(true);
        expect(hasEdge(childCollection, tree, 'tree-children')).toBe(true);
        expect(registry.inspect(mapA)?.subscriptions['key:watched']).toBe(1);
        expect(registry.inspect(setView)?.subscriptions['key:2']).toBe(1);

        keyLifetime.cancel();
        expect(registry.inspect(mapA)?.subscriptions['key:watched']).toBe(0);
        expect(registry.inspect(setView)?.subscriptions['key:2']).toBe(0);
        graphLifetime.cancel();
    });

    it('exposes updates from every collection and structured source family', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 100 });
        const array = new ArrayDataSource([1]);
        const map = new MapDataSource(new Map([['a', 1]]));
        const set = new SetDataSource(['a']);
        const object = new ObjectDataSource({ value: 1 });
        const duplex = new DuplexDataSource(1);
        cleanupTargets.push(array, array.length, map, set, object, duplex);

        array.push(2);
        map.set('b', 2);
        set.add('b');
        object.set('value', 2);
        duplex.write(2);

        expect(registry.inspect(array)).toMatchObject({
            kind: 'array-data-source',
            version: 1,
            value: { type: 'array', size: 2, entries: [{ key: '0' }, { key: '1' }] }
        });
        const arrayEvent = registry
            .getSnapshot()
            .events.find((event) => event.nodeId === resolveAurumDevtoolsNodeId(array) && event.type === 'node-updated');
        expect(arrayEvent).toMatchObject({
            updateKind: 'append',
            details: { operation: { value: 'add' }, index: { value: 1 } }
        });
        expect(registry.inspect(map)?.version).toBe(1);
        expect(registry.inspect(set)?.version).toBe(1);
        expect(registry.inspect(object)?.version).toBe(1);
        expect(registry.inspect(duplex)?.kind).toBe('duplex-data-source');
        expect(registry.inspect(duplex)!.version).toBeGreaterThanOrEqual(1);
    });

    it('tracks tree mutations and unregisters disposable channels', () => {
        type Node = { id: string; children: Node[] | ArrayDataSource<Node> };
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 100 });
        const roots = new ArrayDataSource<Node>([{ id: 'root', children: [] }]);
        const tree = new TreeDataSource<Node, 'children'>('children', roots);
        const token = new CancellationToken();
        tree.listen(() => undefined, token);
        cleanupTargets.push(roots, roots.length, tree);

        roots.push({ id: 'next', children: [] });
        expect(registry.inspect(tree)).toMatchObject({ kind: 'tree-data-source', version: 1 });
        expect(registry.inspect(tree)?.subscriptions.updates).toBe(1);

        const channel = Channel.fromFunction<number, number>((value) => value * 2);
        const channelId = resolveAurumDevtoolsNodeId(channel)!;
        expect(registry.inspect(channelId)?.kind).toBe('channel');
        expect(registry.getSnapshot().edges.filter((edge) => edge.source === channelId || edge.target === channelId)).toHaveLength(2);
        channel.dispose();
        expect(resolveAurumDevtoolsNodeId(channel)).toBeUndefined();
        expect(registry.inspect(channelId)).toBeUndefined();

        token.cancel();
    });

    it('supports host nodes, graph links, live events, and cancellation cleanup', () => {
        const registry = configureAurumDevtools({ mode: 'production', historyLimit: 0, captureStacks: false });
        const lifetime = new CancellationToken();
        const source = { value: 1 };
        const binding = { value: 'one' };
        const sourceId = registerAurumDevtoolsNode(source, { kind: 'custom-source', getValue: (target) => target.value });
        const bindingId = registerAurumDevtoolsNode(binding, { kind: 'render-binding' }, lifetime);
        cleanupTargets.push(source);
        const edgeId = linkAurumDevtoolsNodes(source, binding, { kind: 'render', label: 'text' }, lifetime)!;
        const events: Parameters<Parameters<typeof registry.subscribe>[0]>[0][] = [];
        const unsubscribe = registry.subscribe((event) => events.push(event));

        emitAurumDevtoolsUpdate(source, { kind: 'publish', value: 2, details: { secret: 'not exposed' } });
        expect(registry.inspect(sourceId)?.version).toBe(1);
        const updateEvent = events.find((event) => event.type === 'node-updated' && event.updateKind === 'publish');
        expect(updateEvent).toBeDefined();
        expect(updateEvent?.value).toBeUndefined();
        expect(updateEvent?.details).toBeUndefined();
        expect(registry.getSnapshot().events).toHaveLength(0);
        expect(registry.inspect(bindingId)).toBeDefined();
        expect(registry.getSnapshot().edges.some((edge) => edge.id === edgeId)).toBe(true);

        lifetime.cancel();
        expect(registry.inspect(bindingId)).toBeUndefined();
        expect(registry.getSnapshot().edges.some((edge) => edge.id === edgeId)).toBe(false);
        unsubscribe();
    });

    it('aggregates and redacts production subscription channel names in snapshots and events', () => {
        const registry = configureAurumDevtools({ mode: 'production', historyLimit: 10, captureStacks: true });
        const source = new MapDataSource<string, number>();
        const lifetime = new CancellationToken();
        const events: Parameters<Parameters<typeof registry.subscribe>[0]>[0][] = [];
        const unsubscribe = registry.subscribe((event) => events.push(event));
        cleanupTargets.push(source);

        source.listenOnKey('customer-email', () => undefined, lifetime);
        source.listenOnKey('access-token', () => undefined, lifetime);
        setAurumDevtoolsSubscriptionCount(source, 2, 'tenant:private-name');
        setAurumDevtoolsSubscriptionCount(source, 3, 'another-private-name');
        setAurumDevtoolsSubscriptionCount(source, 1, 'errors');
        setAurumDevtoolsSubscriptionCount(source, Number.NaN, 'invalid-count');
        setAurumDevtoolsSubscriptionCount(source, Number.POSITIVE_INFINITY, 'also-invalid');

        expect(registry.inspect(source)?.subscriptions).toEqual({ keys: 2, other: 5, errors: 1 });
        const subscriptionEvents = events.filter((event) => event.type === 'subscriptions-changed');
        expect(subscriptionEvents.map((event) => event.channel)).toEqual(['keys', 'keys', 'other', 'other', 'errors']);
        expect(subscriptionEvents.map((event) => event.count)).toEqual([1, 2, 2, 5, 1]);
        expect(JSON.stringify(registry.getSnapshot())).not.toContain('customer-email');
        expect(JSON.stringify(registry.getSnapshot())).not.toContain('access-token');
        expect(JSON.stringify(registry.getSnapshot())).not.toContain('private-name');

        lifetime.cancel();
        expect(registry.inspect(source)?.subscriptions.keys).toBe(0);
        expect(events[events.length - 1]).toMatchObject({ type: 'subscriptions-changed', channel: 'keys', count: 0 });
        expect(registry.config.captureStacks).toBe(false);
        unsubscribe();
    });

    it('keeps history bounded and strips rich metadata when switched to production', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: true, historyLimit: 3 });
        const target = { secret: 'debug-only value' };
        const linked = {};
        cleanupTargets.push(target, linked);
        registerAurumDevtoolsNode(target, {
            kind: 'test',
            name: 'debug-only name',
            metadata: { debug: true },
            getValue: (value) => value.secret
        });
        registerAurumDevtoolsNode(linked, { kind: 'linked' });
        const edgeId = linkAurumDevtoolsNodes(target, linked, { kind: 'test-edge', label: 'debug-only label' })!;
        for (let value = 0; value < 10; value++) emitAurumDevtoolsUpdate(target, { value });

        expect(registry.getSnapshot().events).toHaveLength(3);
        expect(registry.inspect(target)?.name).toBe('debug-only name');
        expect(registry.getSnapshot().edges.find((edge) => edge.id === edgeId)?.label).toBe('debug-only label');
        expect(registry.inspect(target)?.metadata?.debug.value).toBe(true);
        expect(registry.inspect(target)?.creationStack).toBeTypeOf('string');
        expect(registry.inspect(target)?.value?.value).toBe('debug-only value');

        configureAurumDevtools({ mode: 'production', captureStacks: true });
        expect(registry.mode).toBe('production');
        expect(registry.getSnapshot().events).toHaveLength(0);
        expect(registry.inspect(target)?.metadata).toBeUndefined();
        expect(registry.inspect(target)?.creationStack).toBeUndefined();
        expect(registry.inspect(target)?.name).toBeUndefined();
        expect(registry.inspect(target)?.value).toBeUndefined();
        expect(registry.getSnapshot().edges.find((edge) => edge.id === edgeId)?.label).toBeUndefined();
        expect(registry.capabilities).not.toContain('annotations');
        expect(registry.capabilities).not.toContain('component-tree');
        expect(registry.config.captureStacks).toBe(false);
        expect(() => ((registry.config as unknown as { mode: string }).mode = 'debug')).toThrow();
    });

    it('creates bounded, serializable previews without throwing on cycles, getters, or proxies', () => {
        const cyclic: Record<string, unknown> = { name: 'cycle' };
        cyclic.self = cyclic;
        Object.defineProperty(cyclic, 'broken', {
            enumerable: true,
            get: () => {
                throw new Error('getter failed');
            }
        });

        const preview = previewAurumDevtoolsValue(cyclic, { previewDepth: 3, previewEntries: 10 });
        expect(preview.entries?.find((entry) => entry.key === 'self')?.value.type).toBe('circular');
        expect(preview.entries?.find((entry) => entry.key === 'broken')?.value.summary).toContain('getter failed');
        expect(() => JSON.stringify(preview)).not.toThrow();

        const hostile = new Proxy(
            {},
            {
                ownKeys: () => {
                    throw new Error('proxy failed');
                },
                get: () => {
                    throw new Error('proxy get failed');
                }
            }
        );
        expect(() => previewAurumDevtoolsValue(hostile)).not.toThrow();
        const revoked = Proxy.revocable([], {});
        revoked.revoke();
        expect(() => previewAurumDevtoolsValue(revoked.proxy)).not.toThrow();
        expect(previewAurumDevtoolsValue(new Array(100).fill(1), { previewEntries: 3 }).entries).toHaveLength(3);

        const wide = Array.from({ length: 20 }, (_, index) => ({ index, children: new Array(20).fill(index) }));
        const budgeted = previewAurumDevtoolsValue(wide, { previewDepth: 10, previewEntries: 20, previewNodeBudget: 9 });
        const countPreviewNodes = (value: typeof budgeted): number =>
            1 + (value.entries?.reduce((count, entry) => count + countPreviewNodes(entry.value), 0) ?? 0);
        expect(countPreviewNodes(budgeted)).toBeLessThanOrEqual(9);
        expect(JSON.stringify(budgeted)).toContain('truncated');
    });

    it('contains inspector callback failures and never changes application behavior', () => {
        const registry = configureAurumDevtools({ mode: 'debug', captureStacks: false, historyLimit: 10 });
        const target = {};
        cleanupTargets.push(target);
        registerAurumDevtoolsNode(target, {
            kind: 'throwing',
            getValue: () => {
                throw new Error('inspect failed');
            }
        });
        const unsubscribe = registry.subscribe(() => {
            throw new Error('listener failed');
        });

        expect(() => emitAurumDevtoolsUpdate(target, { value: 1 })).not.toThrow();
        expect(registry.inspect(target)?.value?.summary).toContain('inspect failed');
        unsubscribe();
    });
});
