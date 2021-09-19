import { Aurum, ErrorBoundary } from '../aurumjs';
import { AurumComponentAPI, Renderable } from '../rendering/aurum_element';

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
