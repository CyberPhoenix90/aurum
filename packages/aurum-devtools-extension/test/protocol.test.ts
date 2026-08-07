import { describe, expect, it } from 'vitest';
import { normalizeEvents, normalizeNode, normalizeSnapshot } from '../src/protocol.js';

describe('devtools protocol normalization', () => {
    it('normalizes the Aurum v1 snapshot without discarding debug metadata', () => {
        const snapshot = normalizeSnapshot({
            protocolVersion: 1,
            runtimeId: 'runtime-1',
            revision: 9,
            mode: 'debug',
            weakReferences: true,
            nodes: [
                {
                    id: 'source-1',
                    kind: 'DataSource',
                    name: 'counter',
                    createdAt: 100,
                    version: 4,
                    subscriptions: { updates: 2, cancellation: 1 },
                    value: { type: 'number', summary: '42', value: 42 },
                    metadata: { owner: { type: 'string', summary: 'Counter' } },
                    creationStack: 'at createCounter (counter.ts:10:2)'
                },
                {
                    id: 'view-1',
                    kind: 'mapped-data-source',
                    createdAt: 101,
                    version: 2,
                    subscriptions: {}
                }
            ],
            edges: [
                {
                    id: 'edge-1',
                    source: 'source-1',
                    target: 'view-1',
                    kind: 'transform',
                    label: 'map',
                    createdAt: 102,
                    metadata: { operator: { type: 'string', summary: 'map' } }
                }
            ],
            events: [
                {
                    sequence: 7,
                    timestamp: 103,
                    type: 'node-updated',
                    nodeId: 'source-1',
                    updateKind: 'value'
                }
            ]
        });

        expect(snapshot).toMatchObject({
            protocolVersion: 1,
            runtimeId: 'runtime-1',
            revision: 9,
            mode: 'debug',
            weakReferences: true
        });
        expect(snapshot.nodes[0]).toMatchObject({
            id: 'source-1',
            subscriberCount: 3,
            subscriptions: { updates: 2, cancellation: 1 },
            stack: 'at createCounter (counter.ts:10:2)',
            annotations: { owner: { type: 'string', summary: 'Counter' } }
        });
        expect(snapshot.edges).toEqual([
            {
                id: 'edge-1',
                source: 'source-1',
                target: 'view-1',
                kind: 'transform',
                label: 'map',
                createdAt: 102,
                metadata: { operator: { type: 'string', summary: 'map' } }
            }
        ]);
        expect(snapshot.recentEvents[0]).toMatchObject({
            id: 'sequence-7',
            sequence: 7,
            type: 'node-updated',
            nodeId: 'source-1',
            updateKind: 'value'
        });
    });

    it('accepts lean production nodes and explicit numeric subscription counts', () => {
        const node = normalizeNode({
            id: 12,
            type: 'channel',
            subscriberCount: 9,
            valuePreview: 'busy'
        });

        expect(node).toEqual({
            id: '12',
            kind: 'channel',
            value: 'busy',
            subscriberCount: 9,
            subscriptions: {},
            upstream: [],
            downstream: []
        });
    });

    it('infers and deduplicates edges from alternate node relationship fields', () => {
        const snapshot = normalizeSnapshot({
            version: 1,
            mode: 'prod',
            sources: {
                first: { id: 'first', kind: 'source', outputs: ['second'] },
                second: { id: 'second', kind: 'source', inputs: [{ id: 'first' }] }
            }
        });

        expect(snapshot.mode).toBe('production');
        expect(snapshot.edges).toEqual([{ source: 'first', target: 'second' }]);
    });

    it('preserves event-specific subscription and edge fields', () => {
        expect(
            normalizeEvents([
                { sequence: 1, timestamp: 1, type: 'subscriptions-changed', nodeId: 'a', channel: 'updates', count: 3 },
                { sequence: 2, timestamp: 2, type: 'edge-removed', edgeId: 'edge-4' }
            ])
        ).toMatchObject([
            { id: 'sequence-1', channel: 'updates', count: 3 },
            { id: 'sequence-2', edgeId: 'edge-4' }
        ]);
    });

    it('preserves parallel labeled edges between the same nodes', () => {
        const snapshot = normalizeSnapshot({
            protocolVersion: 1,
            mode: 'debug',
            nodes: [
                { id: 'source', kind: 'DataSource', subscriptions: {} },
                { id: 'target', kind: 'element', subscriptions: {} }
            ],
            edges: [
                { id: 'edge-text', source: 'source', target: 'target', kind: 'render', label: 'textContent' },
                { id: 'edge-class', source: 'source', target: 'target', kind: 'render', label: 'className' }
            ]
        });

        expect(snapshot.edges).toHaveLength(2);
        expect(snapshot.edges.map((edge) => edge.label)).toEqual(['textContent', 'className']);
    });

    it('suppresses an inferred relationship already represented by an explicit edge', () => {
        const snapshot = normalizeSnapshot({
            protocolVersion: 1,
            mode: 'debug',
            nodes: [
                { id: 'source', kind: 'DataSource', subscriptions: {}, downstream: ['target'] },
                { id: 'target', kind: 'element', subscriptions: {}, upstream: ['source'] }
            ],
            edges: [{ id: 'explicit-edge', source: 'source', target: 'target' }]
        });

        expect(snapshot.edges).toEqual([{ id: 'explicit-edge', source: 'source', target: 'target' }]);
    });
});
