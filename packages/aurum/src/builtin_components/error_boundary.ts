import { AurumComponentAPI, createLifeCycle, Renderable } from '../rendering/aurum_element';
import { DataSource } from '../stream/data_source';

export type ErrorRenderer = (error: any) => Renderable;

export interface ErrorBoundaryProps {
    suspenseFallback?: Renderable;
    errorFallback?: Renderable | ErrorRenderer;
}

export function ErrorBoundary(props: ErrorBoundaryProps, children: Renderable[], api: AurumComponentAPI) {
    const lc = createLifeCycle();
    api.synchronizeLifeCycle(lc);
    const data = new DataSource<Renderable | Renderable[]>(props?.suspenseFallback);
    const renderFallbackError: ErrorRenderer = typeof props?.errorFallback === 'function' ? props.errorFallback : (error) => props?.errorFallback as Renderable;

    function onDone(res: any[]): void {
        if (!api.cancellationToken.isCanceled) {
            data.update(res);
            lc.onAttach();
        }
    }

    function onError(error: any): void {
        lc.onDetach();
        console.error(error);
        if (!api.cancellationToken.isCanceled) {
            data.update(renderFallbackError(error));
            lc.onAttach();
        }
    }

    async function handleRenderedChildren(res: any) {
        if (res instanceof Promise) {
            res.then(handleRenderedChildren, onError);
        } else {
            const nestedRendered = api.prerender(res, lc);
            if (nestedRendered.some((s) => s instanceof Promise)) {
                await Promise.all(nestedRendered).then(handleRenderedChildren, onError);
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
