import { createContext, runInContext, type Context } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
    PAGE_BRIDGE_TTL_MS,
    createClearHighlightExpression,
    createDisposeExpression,
    createHighlightExpression,
    createPollExpression,
    createSetUpdateBreakpointExpression,
    normalizePollResult
} from '../src/inspected_page_bridge.js';

interface RegistryState {
    listener?: (event: unknown) => void;
    snapshot: Record<string, unknown>;
    snapshotCalls: number;
    subscribeCalls: number;
    unsubscribeCalls: number;
    subscribeFailures: number;
}

interface MutableRegistry {
    protocolVersion: number;
    mode: string;
    capabilities: string[];
    runtimeId?: string;
    revision?: number;
    getSnapshot(options?: { includeValues?: boolean }): Record<string, unknown>;
    subscribe(listener: (event: unknown) => void): () => void;
    highlightDomNode?(nodeId: string, duration?: number): boolean;
    clearDomNodeHighlight?(): void;
    setUpdateBreakpoint?(nodeId: string, enabled: boolean): boolean;
}

function createRegistry(options: { runtimeId?: string; revision?: number; subscribeFailures?: number } = {}): {
    registry: MutableRegistry;
    state: RegistryState;
} {
    const state: RegistryState = {
        snapshot: {
            protocolVersion: 1,
            mode: 'debug',
            weakReferences: true,
            ...(options.runtimeId === undefined ? {} : { runtimeId: options.runtimeId }),
            ...(options.revision === undefined ? {} : { revision: options.revision }),
            nodes: [],
            edges: [],
            events: []
        },
        snapshotCalls: 0,
        subscribeCalls: 0,
        unsubscribeCalls: 0,
        subscribeFailures: options.subscribeFailures ?? 0
    };
    const registry: MutableRegistry = {
        protocolVersion: 1,
        mode: 'debug',
        capabilities: ['graph', 'events'],
        ...(options.runtimeId === undefined ? {} : { runtimeId: options.runtimeId }),
        ...(options.revision === undefined ? {} : { revision: options.revision }),
        getSnapshot(request): Record<string, unknown> {
            expect(request).toEqual({ includeValues: false });
            state.snapshotCalls++;
            return state.snapshot;
        },
        subscribe(listener): () => void {
            state.subscribeCalls++;
            if (state.subscribeFailures > 0) {
                state.subscribeFailures--;
                throw new Error('subscription failed');
            }
            state.listener = listener;
            return () => {
                state.unsubscribeCalls++;
                if (state.listener === listener) state.listener = undefined;
            };
        }
    };
    return { registry, state };
}

function createPage(registry: MutableRegistry): {
    advance(milliseconds: number): void;
    evaluate<Result>(expression: string): Result;
    hasBridge(): boolean;
} {
    let now = 1_000;
    let timerId = 0;
    const timers = new Map<number, { callback: () => void; at: number }>();
    class PageDate extends Date {
        public static override now(): number {
            return now;
        }
    }
    const sandbox: Record<PropertyKey, unknown> = {
        Date: PageDate,
        setTimeout(callback: () => void, delay = 0): number {
            const id = ++timerId;
            timers.set(id, { callback, at: now + delay });
            return id;
        },
        clearTimeout(id: number): void {
            timers.delete(id);
        }
    };
    sandbox[Symbol.for('@aurum/devtools')] = registry;
    const context: Context = createContext(sandbox);

    return {
        evaluate<Result>(expression: string): Result {
            return runInContext(expression, context) as Result;
        },
        advance(milliseconds: number): void {
            now += milliseconds;
            let due = Array.from(timers.entries()).filter(([, timer]) => timer.at <= now);
            while (due.length > 0) {
                for (const [id, timer] of due) {
                    timers.delete(id);
                    timer.callback();
                }
                due = Array.from(timers.entries()).filter(([, timer]) => timer.at <= now);
            }
        },
        hasBridge(): boolean {
            return runInContext("globalThis[Symbol.for('@aurum/devtools-extension-bridge')] !== undefined", context) as boolean;
        }
    };
}

describe('inspected-page bridge lifecycle', () => {
    it('uses stable runtime identity and skips unchanged native snapshots', () => {
        const { registry, state } = createRegistry({ runtimeId: 'runtime-stable', revision: 4 });
        const page = createPage(registry);
        const first = normalizePollResult(page.evaluate(createPollExpression('panel-a', 'fallback-a')));
        const second = normalizePollResult(page.evaluate(createPollExpression('panel-a', 'fallback-a')));

        expect(first.runtimeId).toBe('runtime-stable');
        expect(first.snapshot).toBeDefined();
        expect(second.runtimeId).toBe('runtime-stable');
        expect(second.unchanged).toBe(true);
        expect(second.snapshot).toBeUndefined();
        expect(state.snapshotCalls).toBe(1);

        registry.revision = 5;
        state.snapshot.revision = 5;
        const changed = normalizePollResult(page.evaluate(createPollExpression('panel-a', 'fallback-a')));
        expect(changed.snapshot).toBeDefined();
        expect(state.snapshotCalls).toBe(2);
    });

    it('keeps a compatible fallback runtime identity stable', () => {
        const { registry } = createRegistry();
        const page = createPage(registry);
        const first = normalizePollResult(page.evaluate(createPollExpression('panel-a', 'legacy-fallback')));
        const second = normalizePollResult(page.evaluate(createPollExpression('panel-a', 'legacy-fallback')));
        page.advance(PAGE_BRIDGE_TTL_MS);
        const resumed = normalizePollResult(page.evaluate(createPollExpression('panel-a', 'legacy-fallback')));
        expect(first.runtimeId).toBe('legacy-fallback');
        expect(second.runtimeId).toBe('legacy-fallback');
        expect(resumed.runtimeId).toBe('legacy-fallback');
    });

    it('fans events out to multiple clients and tears down after the last client', () => {
        const { registry, state } = createRegistry({ runtimeId: 'runtime', revision: 1 });
        const page = createPage(registry);
        page.evaluate(createPollExpression('panel-a', 'fallback-a'));
        page.evaluate(createPollExpression('panel-b', 'fallback-b'));
        expect(state.subscribeCalls).toBe(1);

        let payloadReads = 0;
        const emittedEvent: Record<string, unknown> = { sequence: 1, timestamp: 1, type: 'node-updated', nodeId: 'node-1' };
        Object.defineProperty(emittedEvent, 'payload', {
            enumerable: true,
            get(): string {
                payloadReads++;
                return 'shared';
            }
        });
        state.listener?.(emittedEvent);
        const firstClient = normalizePollResult(page.evaluate(createPollExpression('panel-a', 'fallback-a')));
        const secondClient = normalizePollResult(page.evaluate(createPollExpression('panel-b', 'fallback-b')));
        expect(firstClient.events).toHaveLength(1);
        expect(secondClient.events).toHaveLength(1);
        expect(payloadReads).toBe(1);

        page.evaluate(createDisposeExpression('panel-a'));
        expect(state.unsubscribeCalls).toBe(0);
        expect(page.hasBridge()).toBe(true);
        page.evaluate(createDisposeExpression('panel-b'));
        expect(state.unsubscribeCalls).toBe(1);
        expect(page.hasBridge()).toBe(false);
    });

    it('preserves omitted protocol fields instead of displaying them as undefined payloads', () => {
        const { registry, state } = createRegistry({ runtimeId: 'runtime', revision: 1 });
        state.snapshot.nodes = [
            {
                id: 'node-1',
                kind: 'data-source',
                subscriptions: {},
                value: undefined,
                metadata: undefined,
                creationStack: undefined
            }
        ];
        const page = createPage(registry);
        const first = normalizePollResult(page.evaluate(createPollExpression('panel', 'fallback')));
        const snapshot = first.snapshot as { nodes: Array<Record<string, unknown>> };

        expect(snapshot.nodes[0]).not.toHaveProperty('value');
        expect(snapshot.nodes[0]).not.toHaveProperty('metadata');
        expect(snapshot.nodes[0]).not.toHaveProperty('creationStack');

        state.listener?.({
            sequence: 1,
            timestamp: 1,
            type: 'subscriptions-changed',
            nodeId: 'node-1',
            channel: 'updates',
            count: 1,
            value: undefined,
            details: undefined
        });
        const next = normalizePollResult(page.evaluate(createPollExpression('panel', 'fallback')));
        const event = next.events?.[0] as Record<string, unknown>;

        expect(event).not.toHaveProperty('value');
        expect(event).not.toHaveProperty('details');
    });

    it('forwards DOM highlighting without moving page nodes across the bridge', () => {
        const { registry } = createRegistry({ runtimeId: 'runtime', revision: 1 });
        const requests: Array<[string, number | undefined]> = [];
        let clears = 0;
        registry.highlightDomNode = (nodeId, duration): boolean => {
            requests.push([nodeId, duration]);
            return nodeId === 'dom-node';
        };
        registry.clearDomNodeHighlight = (): void => {
            clears++;
        };
        const page = createPage(registry);

        expect(page.evaluate(createHighlightExpression('dom-node', 1_200))).toBe(true);
        expect(page.evaluate(createHighlightExpression('data-node'))).toBe(false);
        page.evaluate(createClearHighlightExpression());

        expect(requests).toEqual([
            ['dom-node', 1_200],
            ['data-node', 0]
        ]);
        expect(clears).toBe(1);
    });

    it('toggles update breakpoints inside the inspected page', () => {
        const { registry } = createRegistry({ runtimeId: 'runtime', revision: 1 });
        const requests: Array<[string, boolean]> = [];
        registry.setUpdateBreakpoint = (nodeId, enabled): boolean => {
            requests.push([nodeId, enabled]);
            return enabled;
        };
        const page = createPage(registry);

        expect(page.evaluate(createSetUpdateBreakpointExpression('source-1', true))).toBe(true);
        expect(page.evaluate(createSetUpdateBreakpointExpression('source-1', false))).toBe(false);
        expect(requests).toEqual([
            ['source-1', true],
            ['source-1', false]
        ]);
    });

    it('retries a failed subscription without losing snapshot inspection', () => {
        const { registry, state } = createRegistry({ runtimeId: 'runtime', revision: 1, subscribeFailures: 1 });
        const page = createPage(registry);
        const failed = normalizePollResult(page.evaluate(createPollExpression('panel', 'fallback')));
        expect(failed.available).toBe(true);
        expect(failed.error).toContain('subscription failed');
        expect(state.subscribeCalls).toBe(1);

        const recovered = normalizePollResult(page.evaluate(createPollExpression('panel', 'fallback')));
        expect(recovered.error).toBeUndefined();
        expect(state.subscribeCalls).toBe(2);
        state.listener?.({ sequence: 2, timestamp: 2, type: 'node-updated' });
        expect(normalizePollResult(page.evaluate(createPollExpression('panel', 'fallback'))).events).toHaveLength(1);
    });

    it('expires abandoned clients and cleanly resumes later', () => {
        const { registry, state } = createRegistry({ runtimeId: 'runtime', revision: 1 });
        const page = createPage(registry);
        page.evaluate(createPollExpression('panel', 'fallback'));
        expect(page.hasBridge()).toBe(true);

        page.advance(PAGE_BRIDGE_TTL_MS);
        expect(page.hasBridge()).toBe(false);
        expect(state.unsubscribeCalls).toBe(1);

        const resumed = normalizePollResult(page.evaluate(createPollExpression('panel', 'fallback')));
        expect(resumed.available).toBe(true);
        expect(resumed.runtimeId).toBe('runtime');
        expect(state.subscribeCalls).toBe(2);
    });

    it('falls back to leak-free snapshot polling when the page global bridge slot is frozen', () => {
        const { registry, state } = createRegistry({ runtimeId: 'runtime', revision: 1 });
        const page = createPage(registry);
        // Node's contextified global cannot itself be frozen. A frozen,
        // non-writable bridge slot exercises the same failed-storage path.
        page.evaluate(
            "Object.defineProperty(globalThis, Symbol.for('@aurum/devtools-extension-bridge'), { value: Object.freeze({}), writable: false, configurable: false })"
        );
        const first = normalizePollResult(page.evaluate(createPollExpression('panel', 'fallback')));
        const second = normalizePollResult(page.evaluate(createPollExpression('panel', 'fallback')));

        expect(first).toMatchObject({ available: true, runtimeId: 'runtime', bridgeMode: 'snapshot-only' });
        expect(second.available).toBe(true);
        expect(state.subscribeCalls).toBe(0);
        expect(state.snapshotCalls).toBe(2);
    });

    it('bounds each client queue by approximate serialized bytes', () => {
        const { registry, state } = createRegistry({ runtimeId: 'runtime', revision: 1 });
        const page = createPage(registry);
        page.evaluate(createPollExpression('panel', 'fallback'));
        const payload = 'x'.repeat(500_000);
        state.listener?.({ sequence: 1, payload });
        state.listener?.({ sequence: 2, payload });

        const result = normalizePollResult(page.evaluate(createPollExpression('panel', 'fallback')));
        expect(result.droppedEvents).toBe(1);
        expect(result.events).toHaveLength(1);
    });

    it('batch-trims count overflow instead of shifting once per sustained event', () => {
        const { registry, state } = createRegistry({ runtimeId: 'runtime', revision: 1 });
        const page = createPage(registry);
        page.evaluate(createPollExpression('panel', 'fallback'));
        for (let sequence = 1; sequence <= 2_001; sequence++) {
            state.listener?.({ sequence, type: 'node-updated' });
        }

        const result = normalizePollResult(page.evaluate(createPollExpression('panel', 'fallback')));
        expect(result.droppedEvents).toBe(500);
        expect(result.events).toHaveLength(1_501);
    });
});
