/** Shared renderer batching state. The stable object shape keeps normal render-path reads cheap. @internal */
export const renderBatchState = { active: false };
const renderBatchStateListeners: Array<(active: boolean) => void> = [];

const pendingRenderUpdates = new Map<object, () => void>();
let renderBatchDepth = 0;
let flushing = false;

/** Queues the latest commit for a render binding. Callers should only use this while batching is active. @internal */
export function queueRenderUpdate(binding: object, commit: () => void): void {
    pendingRenderUpdates.set(binding, commit);
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
            const updates = Array.from(pendingRenderUpdates.values());
            pendingRenderUpdates.clear();
            for (const update of updates) {
                try {
                    update();
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
