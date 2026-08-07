/** Shared renderer batching state. The stable object shape keeps normal render-path reads cheap. @internal */
export const renderBatchState = { active: false };
const renderBatchStateListeners: Array<(active: boolean) => void> = [];

interface PendingRenderUpdate {
    commit: (value: any) => void;
    value: unknown;
}

let pendingRenderUpdates = new Map<object, PendingRenderUpdate>();
let renderBatchDepth = 0;
let flushing = false;

/** Queues the latest value for a render binding. Callers should only use this while batching is active. @internal */
export function queueRenderUpdate(binding: object, commit: () => void): void;
export function queueRenderUpdate<T>(binding: object, commit: (value: T) => void, value: T): void;
export function queueRenderUpdate<T>(binding: object, commit: ((value: T) => void) | (() => void), value?: T): void {
    const pending = pendingRenderUpdates.get(binding);
    if (pending?.commit === commit) {
        pending.value = value;
    } else {
        pendingRenderUpdates.set(binding, { commit, value });
    }
}

/** Registers a renderer hook invoked only when batching starts or ends. @internal */
export function listenToRenderBatchState(listener: (active: boolean) => void): void {
    renderBatchStateListeners.push(listener);
}

function setRenderBatchActive(active: boolean): void {
    renderBatchState.active = active;
    for (const listener of renderBatchStateListeners) listener(active);
}

/**
 * Runs synchronous state changes while coalescing DOM work to the final value of each render binding.
 * Streams and non-rendering listeners remain fully synchronous. DOM changes are flushed before this function returns.
 */
export function batchRender<T>(callback: () => T): T {
    renderBatchDepth++;
    if (renderBatchDepth === 1) setRenderBatchActive(true);
    try {
        const result = callback();
        if (result && typeof (result as { then?: unknown }).then === 'function') {
            throw new Error('batchRender callbacks must be synchronous and must not return a Promise');
        }
        return result;
    } finally {
        renderBatchDepth--;
        if (renderBatchDepth === 0) {
            setRenderBatchActive(false);
            flushRenderUpdates();
        }
    }
}

function flushRenderUpdates(): void {
    if (flushing || pendingRenderUpdates.size === 0) return;
    flushing = true;
    let firstError: unknown;
    try {
        while (pendingRenderUpdates.size > 0) {
            const updates = pendingRenderUpdates;
            pendingRenderUpdates = new Map();
            for (const update of updates.values()) {
                try {
                    update.commit(update.value);
                } catch (error) {
                    firstError ??= error;
                }
            }
        }
    } finally {
        flushing = false;
    }
    if (firstError !== undefined) throw firstError;
}
