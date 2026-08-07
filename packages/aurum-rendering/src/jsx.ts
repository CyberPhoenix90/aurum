import {
    AurumComponentAPI as CoreComponentAPI,
    AurumComponent as CoreComponent,
    AurumElementModel as CoreElementModel,
    aurumElementModelIdentitiy,
    Renderable as CoreRenderable
} from './rendering/aurum_element.js';

export type AurumDecorator = (model: CoreElementModel<unknown>) => CoreRenderable;

/** JSX factory for renderer-only component trees. Intrinsic tags are deliberately unsupported. */
export class Aurum {
    public static fragment(_props?: unknown, _children?: CoreRenderable[], _api?: CoreComponentAPI): void {}

    public static factory<T>(
        component: CoreComponent<T> | string,
        props: T | null,
        ...children: CoreRenderable[]
    ): CoreElementModel<T> | typeof children {
        if (component === Aurum.fragment) {
            return children;
        }
        if (typeof component === 'string') {
            throw new Error(`Intrinsic tag ${component} requires @aurum/html`);
        }

        let model: CoreElementModel<T> = {
            [aurumElementModelIdentitiy]: true,
            name: component.name,
            isIntrinsic: false,
            factory: component,
            props: (props ?? {}) as T,
            children: children as CoreRenderable[]
        };

        const decorators = (props as Record<string, unknown> | null)?.decorate;
        if (decorators !== undefined) {
            for (const decorate of Array.isArray(decorators) ? decorators : [decorators]) {
                if (typeof decorate !== 'function') {
                    throw new Error('Decorate must be a function or an array of functions');
                }
                model = decorate(model as CoreElementModel<unknown>) as CoreElementModel<T>;
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
