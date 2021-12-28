import { Aurum, ErrorBoundary } from '../aurumjs.js';
import { AurumComponentAPI, Renderable } from '../rendering/aurum_element.js';

export interface SuspenseProps {
    fallback?: Renderable;
}

export function Suspense(props: SuspenseProps, children: Renderable[], api: AurumComponentAPI) {
    return (
        <ErrorBoundary
            suspenseFallback={props?.fallback}
            errorFallback={(error) => {
                throw error;
            }}
        >
            {children}
        </ErrorBoundary>
    );
}
