import { normalizeMode, type PagePollResult, type RuntimeStatus } from './protocol.js';

export const PAGE_BRIDGE_TTL_MS = 5_000;

export class InspectedPageBridge {
    private readonly clientId = createIdentifier('panel');
    private readonly fallbackRuntimeId = createIdentifier('legacy-runtime');

    public async poll(): Promise<PagePollResult> {
        const result = await evaluateInPage(createPollExpression(this.clientId, this.fallbackRuntimeId));
        return normalizePollResult(result);
    }

    public async inspect(nodeId: string): Promise<unknown> {
        return evaluateInPage(createInspectExpression(nodeId));
    }

    public async dispose(): Promise<void> {
        await evaluateInPage(createDisposeExpression(this.clientId)).catch((_error: unknown): undefined => undefined);
    }
}

/** Exported to let the bridge lifecycle be exercised without a Chromium host. */
export function createPollExpression(clientId: string, fallbackRuntimeId: string): string {
    const encodedClientId = JSON.stringify(clientId);
    const encodedFallbackRuntimeId = JSON.stringify(fallbackRuntimeId);
    const ttl = PAGE_BRIDGE_TTL_MS;

    return String.raw`(() => {
        const clientId = ${encodedClientId};
        const fallbackRuntimeId = ${encodedFallbackRuntimeId};
        const timeToLive = ${ttl};
        const registryKey = Symbol.for('@aurum/devtools');
        const bridgeKey = Symbol.for('@aurum/devtools-extension-bridge');
        let registry;
        let previousHub;
        try { registry = globalThis[registryKey] || globalThis.__AURUM_DEVTOOLS__; } catch {}
        try { previousHub = globalThis[bridgeKey]; } catch {}

        const errorText = (error) => {
            try {
                return error instanceof Error ? (error.stack || error.message) : String(error);
            } catch {
                return 'Unknown inspected-page error';
            }
        };

        const serializeWithSize = (root) => {
            const seen = new WeakSet();
            let bytes = 0;
            const countText = (text) => { bytes += Math.max(2, String(text).length * 2); };
            const visit = (value, depth) => {
                if (value === null) { bytes += 8; return value; }
                if (typeof value === 'string') { countText(value); return value; }
                if (typeof value === 'boolean') { bytes += value ? 8 : 10; return value; }
                if (typeof value === 'number') {
                    const result = Number.isFinite(value) ? value : String(value);
                    countText(result);
                    return result;
                }
                if (typeof value === 'undefined') { countText('[undefined]'); return '[undefined]'; }
                if (typeof value === 'bigint') { const result = value.toString() + 'n'; countText(result); return result; }
                if (typeof value === 'symbol') { const result = value.toString(); countText(result); return result; }
                if (typeof value === 'function') {
                    const result = '[Function ' + (value.name || 'anonymous') + ']';
                    countText(result);
                    return result;
                }
                if (depth > 8) { countText('[Maximum depth]'); return '[Maximum depth]'; }
                if (seen.has(value)) { countText('[Circular]'); return '[Circular]'; }
                seen.add(value);

                if (value instanceof Error) {
                    return visit({ name: value.name, message: value.message, stack: value.stack }, depth + 1);
                }
                if (value instanceof Date) {
                    const result = value.toISOString();
                    countText(result);
                    return result;
                }
                if (Array.isArray(value)) {
                    bytes += 4;
                    const limit = Math.min(value.length, 10000);
                    const result = new Array(limit);
                    for (let index = 0; index < limit; index++) {
                        try { result[index] = visit(value[index], depth + 1); }
                        catch (error) {
                            result[index] = '[Unreadable: ' + errorText(error) + ']';
                            countText(result[index]);
                        }
                    }
                    if (value.length > limit) {
                        const truncated = '[Truncated ' + (value.length - limit) + ' items]';
                        countText(truncated);
                        result.push(truncated);
                    }
                    return result;
                }

                const output = {};
                bytes += 4;
                let keys;
                try { keys = Object.keys(value); }
                catch (error) {
                    const result = '[Unreadable object: ' + errorText(error) + ']';
                    countText(result);
                    return result;
                }
                const limit = Math.min(keys.length, 1000);
                for (let index = 0; index < limit; index++) {
                    const key = keys[index];
                    countText(key);
                    try { output[key] = visit(value[key], depth + 1); }
                    catch (error) {
                        output[key] = '[Unreadable: ' + errorText(error) + ']';
                        countText(output[key]);
                    }
                }
                if (keys.length > limit) {
                    countText('[truncated]');
                    countText(keys.length - limit);
                    output['[truncated]'] = keys.length - limit;
                }
                return output;
            };

            try { return { value: visit(root, 0), bytes: Math.max(2, bytes) }; }
            catch (error) {
                const value = '[Serialization failed: ' + errorText(error) + ']';
                countText(value);
                return { value, bytes: Math.max(2, bytes) };
            }
        };
        const makeSerializable = (root) => serializeWithSize(root).value;

        const deleteStoredHub = (hub) => {
            try {
                if (globalThis[bridgeKey] === hub) delete globalThis[bridgeKey];
            } catch {}
        };

        const disposeLegacyHub = (hub) => {
            if (!hub) return;
            try { if (hub.expiryTimer !== undefined) clearTimeout(hub.expiryTimer); } catch {}
            try {
                if (typeof hub.unsubscribe === 'function') hub.unsubscribe();
                else if (hub.unsubscribe && typeof hub.unsubscribe.cancel === 'function') hub.unsubscribe.cancel();
            } catch {}
            deleteStoredHub(hub);
        };

        if (!registry || typeof registry.getSnapshot !== 'function') {
            if (previousHub && typeof previousHub.dispose === 'function') previousHub.dispose();
            else disposeLegacyHub(previousHub);
            return {
                available: false,
                mode: 'unknown',
                capabilities: [],
                droppedEvents: 0,
                bridgeMode: 'snapshot-only'
            };
        }

        const createHub = () => {
            const hub = {
                bridgeVersion: 3,
                registry,
                fallbackRuntimeId,
                runtimeId: undefined,
                clients: Object.create(null),
                subscribed: false,
                unsubscribe: undefined,
                subscriptionError: undefined,
                expiryTimer: undefined,
                disposed: false,
                maximumEventsPerClient: 2000,
                maximumEventBytesPerClient: 1500000,
                makeSerializable
            };

            hub.dispose = () => {
                if (hub.disposed) return;
                hub.disposed = true;
                try { if (hub.expiryTimer !== undefined) clearTimeout(hub.expiryTimer); } catch {}
                hub.expiryTimer = undefined;
                try {
                    if (typeof hub.unsubscribe === 'function') hub.unsubscribe();
                    else if (hub.unsubscribe && typeof hub.unsubscribe.cancel === 'function') hub.unsubscribe.cancel();
                } catch {}
                hub.unsubscribe = undefined;
                hub.subscribed = false;
                for (const id of Object.keys(hub.clients)) delete hub.clients[id];
                deleteStoredHub(hub);
            };

            hub.prune = () => {
                const now = Date.now();
                for (const id of Object.keys(hub.clients)) {
                    if (now - hub.clients[id].lastPollAt >= timeToLive) delete hub.clients[id];
                }
                if (Object.keys(hub.clients).length === 0) hub.dispose();
            };

            hub.scheduleExpiry = () => {
                if (hub.disposed) return;
                try { if (hub.expiryTimer !== undefined) clearTimeout(hub.expiryTimer); } catch {}
                const clients = Object.values(hub.clients);
                if (clients.length === 0) {
                    hub.dispose();
                    return;
                }
                const nextExpiry = Math.min(...clients.map((client) => client.lastPollAt + timeToLive));
                hub.expiryTimer = setTimeout(() => {
                    hub.prune();
                    if (!hub.disposed) hub.scheduleExpiry();
                }, Math.max(1, nextExpiry - Date.now()));
            };

            hub.ensureSubscription = () => {
                if (hub.disposed || hub.subscribed || typeof registry.subscribe !== 'function') return;
                try {
                    const cancellation = registry.subscribe((event) => {
                        if (hub.disposed) return;
                        const now = Date.now();
                        for (const id of Object.keys(hub.clients)) {
                            const client = hub.clients[id];
                            if (now - client.lastPollAt >= timeToLive) {
                                delete hub.clients[id];
                            }
                        }
                        const activeClientIds = Object.keys(hub.clients);
                        if (activeClientIds.length === 0) {
                            hub.dispose();
                            return;
                        }
                        // The serialized event is immutable page-bridge data;
                        // every panel can safely share it without re-walking
                        // the inspected value for each DevTools window.
                        const serialized = serializeWithSize(event);
                        for (const id of activeClientIds) {
                            const client = hub.clients[id];
                            const value = serialized.value;
                            const bytes = serialized.bytes;
                            client.events.push({ value, bytes });
                            client.eventBytes += bytes;
                            let removeCount = 0;
                            let removedBytes = 0;
                            const overBudget =
                                client.events.length > hub.maximumEventsPerClient ||
                                client.eventBytes > hub.maximumEventBytesPerClient;
                            const minimumRemoveCount = overBudget ? Math.max(1, Math.floor(client.events.length / 4)) : 0;
                            while (
                                removeCount < client.events.length &&
                                (removeCount < minimumRemoveCount ||
                                    client.events.length - removeCount > hub.maximumEventsPerClient ||
                                    client.eventBytes - removedBytes > hub.maximumEventBytesPerClient)
                            ) {
                                removedBytes += client.events[removeCount].bytes;
                                removeCount++;
                            }
                            if (removeCount > 0) {
                                client.events.splice(0, removeCount);
                                client.eventBytes -= removedBytes;
                                client.droppedEvents += removeCount;
                            }
                        }
                    });
                    hub.unsubscribe = cancellation;
                    hub.subscribed = true;
                    hub.subscriptionError = undefined;
                } catch (error) {
                    // Remain unsubscribed so the next poll retries. Snapshot
                    // polling remains useful while subscription is unavailable.
                    hub.subscriptionError = errorText(error);
                }
            };

            return hub;
        };

        let hub = previousHub;
        if (
            !hub ||
            hub.bridgeVersion !== 3 ||
            hub.registry !== registry ||
            hub.disposed ||
            !hub.clients ||
            typeof hub.dispose !== 'function' ||
            typeof hub.ensureSubscription !== 'function' ||
            typeof hub.scheduleExpiry !== 'function'
        ) {
            if (hub && typeof hub.dispose === 'function') hub.dispose();
            else disposeLegacyHub(hub);
            hub = createHub();
            let stored = false;
            try {
                globalThis[bridgeKey] = hub;
                stored = globalThis[bridgeKey] === hub;
            } catch {}
            if (!stored) {
                // A frozen/non-extensible page global cannot safely own a
                // subscription. Continue with stateless snapshots instead.
                hub.dispose();
                hub = undefined;
            }
        }

        let bridgeMode = 'shared';
        let client;
        if (hub) {
            client = hub.clients[clientId];
            if (!client) {
                client = {
                    events: [],
                    eventBytes: 0,
                    droppedEvents: 0,
                    lastPollAt: Date.now(),
                    lastSnapshotRevision: undefined
                };
                hub.clients[clientId] = client;
            }
            client.lastPollAt = Date.now();
            hub.ensureSubscription();
            hub.scheduleExpiry();
        } else {
            bridgeMode = 'snapshot-only';
        }

        let registryRevision;
        try {
            const candidate = registry.revision;
            if (typeof candidate === 'string' || (typeof candidate === 'number' && Number.isFinite(candidate))) {
                registryRevision = candidate;
            }
        } catch {}

        const unchanged = Boolean(client && registryRevision !== undefined && client.lastSnapshotRevision === registryRevision);
        let snapshot;
        let snapshotError;
        if (!unchanged) {
            try { snapshot = makeSerializable(registry.getSnapshot({ includeValues: false })); }
            catch (error) { snapshotError = errorText(error); }
        }

        const events = client ? client.events.splice(0, client.events.length).map((entry) => entry.value) : [];
        const droppedEvents = client ? client.droppedEvents : 0;
        if (client) {
            client.droppedEvents = 0;
            client.eventBytes = 0;
        }
        const snapshotRecord = snapshot && typeof snapshot === 'object' ? snapshot : {};
        const snapshotRevision = snapshotRecord.revision ?? snapshotRecord.snapshotRevision ?? registryRevision;
        if (client && snapshotError === undefined && (typeof snapshotRevision === 'string' || typeof snapshotRevision === 'number')) {
            client.lastSnapshotRevision = snapshotRevision;
        }
        const protocolVersion = registry.protocolVersion ?? registry.version ?? snapshotRecord.protocolVersion ?? snapshotRecord.version;
        const mode = registry.mode ?? registry.config?.mode ?? snapshotRecord.mode ?? 'unknown';
        const ownedRuntimeId = registry.runtimeId ?? snapshotRecord.runtimeId;
        if (hub && (typeof ownedRuntimeId === 'string' || typeof ownedRuntimeId === 'number')) {
            hub.runtimeId = String(ownedRuntimeId);
        }
        const runtimeId =
            typeof ownedRuntimeId === 'string' || typeof ownedRuntimeId === 'number'
                ? String(ownedRuntimeId)
                : (hub ? (hub.runtimeId || hub.fallbackRuntimeId) : fallbackRuntimeId);
        let capabilities = registry.capabilities ?? snapshotRecord.capabilities ?? [];
        if (!Array.isArray(capabilities)) capabilities = [];

        return {
            available: snapshotError === undefined,
            runtimeId,
            protocolVersion,
            mode,
            capabilities: makeSerializable(capabilities),
            droppedEvents,
            snapshot,
            events,
            unchanged,
            bridgeMode,
            error: snapshotError || (hub ? hub.subscriptionError : undefined)
        };
    })()`;
}

export function createInspectExpression(nodeId: string): string {
    const encodedId = JSON.stringify(nodeId);
    return String.raw`(() => {
        let registry;
        let bridge;
        try { registry = globalThis[Symbol.for('@aurum/devtools')] || globalThis.__AURUM_DEVTOOLS__; } catch {}
        try { bridge = globalThis[Symbol.for('@aurum/devtools-extension-bridge')]; } catch {}
        if (!registry || typeof registry.inspect !== 'function') return undefined;
        try {
            const result = registry.inspect(${encodedId});
            return bridge && typeof bridge.makeSerializable === 'function' ? bridge.makeSerializable(result) : result;
        } catch (error) {
            return { inspectionError: error instanceof Error ? (error.stack || error.message) : String(error) };
        }
    })()`;
}

export function createDisposeExpression(clientId: string): string {
    const encodedClientId = JSON.stringify(clientId);
    return String.raw`(() => {
        const bridgeKey = Symbol.for('@aurum/devtools-extension-bridge');
        let hub;
        try { hub = globalThis[bridgeKey]; } catch {}
        if (!hub) return;
        if (hub.bridgeVersion !== 3 || !hub.clients) {
            try { if (hub.expiryTimer !== undefined) clearTimeout(hub.expiryTimer); } catch {}
            try {
                if (typeof hub.unsubscribe === 'function') hub.unsubscribe();
                else if (hub.unsubscribe && typeof hub.unsubscribe.cancel === 'function') hub.unsubscribe.cancel();
            } catch {}
            try { delete globalThis[bridgeKey]; } catch {}
            return;
        }
        delete hub.clients[${encodedClientId}];
        if (Object.keys(hub.clients).length === 0) hub.dispose();
        else if (typeof hub.scheduleExpiry === 'function') hub.scheduleExpiry();
    })()`;
}

export function normalizePollResult(raw: unknown): PagePollResult {
    const source = isRecord(raw) ? raw : {};
    const capabilities = Array.isArray(source.capabilities)
        ? source.capabilities.filter((capability): capability is string => typeof capability === 'string')
        : [];
    const version = typeof source.protocolVersion === 'number' ? source.protocolVersion : undefined;
    const runtimeId = typeof source.runtimeId === 'string' ? source.runtimeId : undefined;
    const bridgeMode = source.bridgeMode === 'shared' || source.bridgeMode === 'snapshot-only' ? source.bridgeMode : undefined;
    const status: RuntimeStatus = {
        available: source.available === true,
        ...(runtimeId === undefined ? {} : { runtimeId }),
        ...(version === undefined ? {} : { protocolVersion: version }),
        mode: normalizeMode(source.mode),
        capabilities,
        ...(bridgeMode === undefined ? {} : { bridgeMode }),
        ...(typeof source.error !== 'string' ? {} : { error: source.error }),
        droppedEvents: typeof source.droppedEvents === 'number' ? source.droppedEvents : 0
    };

    return {
        ...status,
        ...(!('snapshot' in source) ? {} : { snapshot: source.snapshot }),
        ...(Array.isArray(source.events) ? { events: source.events } : {}),
        ...(typeof source.unchanged === 'boolean' ? { unchanged: source.unchanged } : {})
    };
}

function evaluateInPage(expression: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
        chrome.devtools.inspectedWindow.eval(expression, (result, exceptionInfo) => {
            if (exceptionInfo?.isException) {
                reject(new Error(exceptionInfo.description ?? exceptionInfo.value ?? 'Inspected-page evaluation failed'));
                return;
            }

            resolve(result);
        });
    });
}

function createIdentifier(prefix: string): string {
    const randomPart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${randomPart}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}
