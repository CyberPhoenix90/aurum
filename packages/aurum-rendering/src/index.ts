import type { ReadOnlyArrayDataSource as CoreReadOnlyArrayDataSource, ReadOnlyDataSource as CoreReadOnlyDataSource } from '@aurum/streams';
import {
    AurumComponentAPI as CoreComponentAPI,
    AurumElementModel as CoreElementModel,
    aurumElementModelIdentitiy,
    Renderable as CoreRenderable
} from 'aurumjs/rendering';

export * from '@aurum/streams';
export * from 'aurumjs/rendering';

export type AurumDecorator = (model: CoreElementModel<unknown>) => CoreRenderable;

/** JSX factory for renderer-only component trees. Intrinsic tags are deliberately unsupported. */
export class Aurum {
    public static fragment(_props?: unknown, _children?: CoreRenderable[], _api?: CoreComponentAPI): void {}

    public static factory(
        component: ((props: unknown, children: CoreRenderable[], api: CoreComponentAPI) => CoreRenderable) | string,
        props: Record<string, unknown> | null,
        ...children: Array<CoreElementModel<unknown> | CoreReadOnlyDataSource<unknown> | CoreReadOnlyArrayDataSource<unknown>>
    ): CoreElementModel<unknown> | typeof children {
        if (component === Aurum.fragment) {
            return children;
        }
        if (typeof component === 'string') {
            throw new Error(`Intrinsic tag ${component} requires @aurum/html`);
        }

        let model: CoreElementModel<unknown> = {
            [aurumElementModelIdentitiy]: true,
            name: component.name,
            isIntrinsic: false,
            factory: component,
            props: props ?? {},
            children: children as CoreRenderable[]
        };

        const decorators = props?.decorate;
        if (decorators !== undefined) {
            for (const decorate of Array.isArray(decorators) ? decorators : [decorators]) {
                if (typeof decorate !== 'function') {
                    throw new Error('Decorate must be a function or an array of functions');
                }
                model = decorate(model) as CoreElementModel<unknown>;
            }
        }
        return model;
    }
}

export namespace Aurum {
    export namespace JSX {
        export interface IntrinsicAttributes {
            decorate?: AurumDecorator | AurumDecorator[];
        }

        // Intentionally empty. Renderer packages add only the intrinsic nodes
        // they implement; importing @aurum/html supplies the HTML tag set.
        export interface IntrinsicElements {}
    }
}
