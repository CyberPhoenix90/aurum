import { describe, expect, it } from 'vitest';
import type { DevtoolsEvent, DevtoolsNode, DevtoolsSnapshot, RuntimeStatus } from '../src/protocol.js';
import {
    arrayPreview,
    buildComponentTree,
    compactValue,
    createPanelRevision,
    filterComponentTree,
    filterNodes,
    layoutGraph,
    mergeEvents,
    paginateItems,
    relatedGraphNodeIds,
    shouldPollPanel,
    shouldRefreshInspection,
    updatedNodeIds
} from '../src/panel_state.js';

function event(id: string, timestamp: number): DevtoolsEvent {
    return { id, timestamp, type: 'node-updated' };
}

function node(id: string, kind = 'DataSource', name?: string): DevtoolsNode {
    return {
        id,
        kind,
        ...(name === undefined ? {} : { name }),
        value: { summary: id },
        subscriberCount: 0,
        subscriptions: {},
        upstream: [],
        downstream: []
    };
}

describe('panel state', () => {
    it('merges event batches by stable event identity and enforces its history bound', () => {
        const result = mergeEvents([event('one', 1), event('two', 2)], [event('two', 2), event('three', 3)], 2);
        expect(result.map((item) => item.id)).toEqual(['two', 'three']);
    });

    it('selects unique node update targets for graph flashes', () => {
        expect(
            updatedNodeIds([
                { ...event('one', 1), nodeId: 'a' },
                { ...event('two', 2), nodeId: 'a' },
                { ...event('three', 3), nodeId: 'b' },
                { id: 'four', timestamp: 4, type: 'subscriptions-changed', nodeId: 'c' },
                event('five', 5)
            ])
        ).toEqual(['a', 'b']);
    });

    it('finds the direct upstream and downstream graph neighbors of a selection', () => {
        const related = relatedGraphNodeIds('selected', [
            { source: 'upstream-a', target: 'selected' },
            { source: 'upstream-b', target: 'selected' },
            { source: 'selected', target: 'downstream' },
            { source: 'unrelated-a', target: 'unrelated-b' }
        ]);
        expect(Array.from(related.upstream)).toEqual(['upstream-a', 'upstream-b']);
        expect(Array.from(related.downstream)).toEqual(['downstream']);
    });

    it('filters nodes by the name, kind, and id fields available in topology snapshots', () => {
        const nodes = [node('1', 'DataSource', 'temperature'), node('2', 'ArrayDataSource', 'results')];

        expect(filterNodes(nodes, 'TEMP', '')).toEqual([nodes[0]]);
        expect(filterNodes(nodes, '', 'ArrayDataSource')).toEqual([nodes[1]]);
        expect(filterNodes(nodes, '2', 'DataSource')).toEqual([]);
        expect(filterNodes([node('id-without-match')], 'id-without-match', '')).toHaveLength(1);
        expect(filterNodes([node('source')], 'source', '')).toHaveLength(1);
        const valueOnlyMatch = node('unrelated-id', 'DataSource');
        valueOnlyMatch.value = { summary: 'hidden-value-needle' };
        expect(filterNodes([valueOnlyMatch], 'hidden-value-needle', '')).toEqual([]);
    });

    it('uses structured preview summaries in compact value labels', () => {
        expect(compactValue({ type: 'array', summary: 'Array(1,000)', size: 1000 })).toBe('Array(1,000)');
        expect(compactValue('abcdefghijklmnopqrstuvwxyz', 8)).toBe('abcdefg…');
    });

    it('extracts indexed ArrayDataSource items from structured value previews', () => {
        const first = { type: 'string', summary: '"first"', value: 'first' };
        expect(
            arrayPreview({ type: 'array', summary: 'Array(3)', size: 3, entries: [{ key: '0', value: first }], truncated: true })
        ).toEqual({ size: 3, truncated: true, items: [{ index: '0', value: first }] });
        expect(arrayPreview({ summary: 'not an array' })).toBeUndefined();
    });

    it('builds a component and host DOM hierarchy without duplicating nested output nodes', () => {
        const application = node('application', 'component', 'Application');
        const child = node('child', 'component', 'Child');
        const div = node('div', 'dom-element', '<div>');
        const span = node('span', 'dom-element', '<span>');
        const entries = buildComponentTree([application, div, child, span], [
            { source: 'application', target: 'child', kind: 'component-child' },
            { source: 'application', target: 'div', kind: 'component-output' },
            { source: 'child', target: 'span', kind: 'component-output' },
            { source: 'div', target: 'span', kind: 'dom-child' }
        ]);

        expect(entries.map((entry) => [entry.node.id, entry.depth, entry.parentId])).toEqual([
            ['application', 0, undefined],
            ['div', 1, 'application'],
            ['child', 2, 'div'],
            ['span', 3, 'child']
        ]);
        expect(filterComponentTree(entries, 'span', '').map((entry) => entry.node.id)).toEqual(['application', 'div', 'child', 'span']);
    });

    it('lays acyclic data flow from left to right', () => {
        const nodes = [node('source'), node('mapped'), node('render')];
        const layout = layoutGraph(nodes, [
            { source: 'source', target: 'mapped' },
            { source: 'mapped', target: 'render' }
        ]);
        const positions = new Map(layout.nodes.map((position) => [position.node.id, position.x]));

        expect(positions.get('source')).toBeLessThan(positions.get('mapped') ?? 0);
        expect(positions.get('mapped')).toBeLessThan(positions.get('render') ?? 0);
        expect(layout.edges).toHaveLength(2);
    });

    it('keeps cyclic and dangling graphs finite', () => {
        const layout = layoutGraph([node('a'), node('b')], [
            { source: 'a', target: 'b' },
            { source: 'b', target: 'a' },
            { source: 'missing', target: 'a' }
        ]);

        expect(layout.nodes).toHaveLength(2);
        expect(layout.edges).toHaveLength(2);
        expect(layout.nodes.every((position) => Number.isFinite(position.x) && Number.isFinite(position.y))).toBe(true);
    });

    it('clamps and slices node pages', () => {
        expect(paginateItems([0, 1, 2, 3, 4], 1, 2)).toEqual({
            items: [2, 3],
            page: 1,
            pageCount: 3,
            start: 2,
            end: 4,
            total: 5
        });
        expect(paginateItems([0, 1, 2], 99, 2)).toMatchObject({ items: [2], page: 1, pageCount: 2 });
        expect(paginateItems([], Number.NaN, Number.NaN)).toMatchObject({ items: [], page: 0, pageCount: 1 });
    });

    it('gates polling while hidden, paused, or disposed', () => {
        expect(shouldPollPanel(true, true, false, false)).toBe(true);
        expect(shouldPollPanel(false, true, false, false)).toBe(false);
        expect(shouldPollPanel(true, false, false, false)).toBe(false);
        expect(shouldPollPanel(true, true, true, false)).toBe(false);
        expect(shouldPollPanel(true, true, false, true)).toBe(false);
    });

    it('refreshes inspection only for selection, selected version changes, or legacy selected-node events', () => {
        const previous = { id: 'selected', version: 2 };
        expect(shouldRefreshInspection(false, previous, { id: 'selected', version: 2 }, false)).toBe(false);
        expect(shouldRefreshInspection(false, previous, { id: 'selected', version: 3 }, false)).toBe(true);
        expect(shouldRefreshInspection(false, previous, { id: 'unrelated', version: 3 }, false)).toBe(false);
        expect(shouldRefreshInspection(true, previous, { id: 'selected', version: 2 }, false)).toBe(true);
        expect(shouldRefreshInspection(false, previous, { id: 'selected', version: 2 }, true)).toBe(true);
    });

    it('uses a native revision without walking the graph and falls back for legacy snapshots', () => {
        const status: RuntimeStatus = {
            available: true,
            runtimeId: 'runtime',
            protocolVersion: 1,
            mode: 'debug',
            capabilities: [],
            droppedEvents: 0
        };
        const guardedNode = node('guarded');
        Object.defineProperty(guardedNode, 'name', {
            get(): string {
                throw new Error('native revisions must not inspect node fields');
            }
        });
        const native: DevtoolsSnapshot = {
            protocolVersion: 1,
            runtimeId: 'runtime',
            revision: 4,
            mode: 'debug',
            timestamp: 1,
            nodes: [guardedNode],
            edges: [],
            recentEvents: []
        };
        expect(() => createPanelRevision(native, [], status)).not.toThrow();

        const legacy: DevtoolsSnapshot = { ...native, revision: undefined, nodes: [node('legacy')] };
        const before = createPanelRevision(legacy, [], status);
        legacy.nodes[0].version = 2;
        expect(createPanelRevision(legacy, [], status)).not.toBe(before);
    });
});
