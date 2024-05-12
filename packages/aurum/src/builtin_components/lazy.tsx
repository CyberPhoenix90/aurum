import { AurumComponent, Renderable } from '../rendering/aurum_element.js';
import { Aurum } from '../utilities/aurum.js';
import { ErrorBoundary } from './error_boundary.js';

export interface LazyProps<T> {
    lazyComponentProps: T;
    loader: () => Promise<{ default: AurumComponent<T> } | AurumComponent<T>>;
    fallback?: Renderable;
    errorFallback?: Renderable;
}
export function Lazy<T>(props: LazyProps<T>) {
    return (
        <ErrorBoundary errorFallback={props.errorFallback} suspenseFallback={props.fallback}>
            {props.loader().then((module) => {
                return Aurum.factory(typeof module === 'function' ? module : module.default, props.lazyComponentProps);
            })}
        </ErrorBoundary>
    );
}
