import { AurumComponentAPI, createLifeCycle, Renderable } from '../rendering/aurum_element.js';
import { DataSource } from '@aurum/streams';

export type ErrorRenderer = (error: unknown) => Renderable;

export interface ErrorBoundaryProps {
    suspenseFallback?: Renderable;
    errorFallback?: Renderable | ErrorRenderer;
}

export function ErrorBoundary(props: ErrorBoundaryProps, children: Renderable[], api: AurumComponentAPI) {
    const data = new DataSource<Renderable>(props?.suspenseFallback);
    const renderFallbackError: ErrorRenderer = typeof props?.errorFallback === 'function' ? props.errorFallback : (error) => props?.errorFallback as Renderable;

    const lc = createLifeCycle();
    api.onDetach(() => lc.onDetach());

    function onDone(res: Renderable[]): void {
        if (!api.cancellationToken.isCancelled) {
            data.update(res);
            lc.onAttach();
        }
    }

    function onError(error: unknown): void {
        console.error(error);
        if (!api.cancellationToken.isCancelled) {
            data.update(renderFallbackError(error));
        }
    }

    async function handleRenderedChildren(res: Renderable): Promise<void> {
        if (res instanceof Promise) {
            await (res as Promise<unknown>).then((value) => handleRenderedChildren(value as Renderable), onError);
        } else {
            const nestedRendered = api.prerender(Array.isArray(res) ? res : [res], lc);
            if (nestedRendered.some((s) => s instanceof Promise)) {
                const resolved = await Promise.all(nestedRendered as unknown[]);
                await handleRenderedChildren(resolved as Renderable[]);
            } else {
                onDone(nestedRendered);
            }
        }
    }

    async function renderChildren() {
        try {
            const rendered = api.prerender(children, lc);
            await handleRenderedChildren(rendered);
        } catch (error) {
            onError(error);
        }
    }
    renderChildren();

    return data;
}
