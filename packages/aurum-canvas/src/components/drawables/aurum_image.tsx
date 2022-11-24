import { AurumComponentAPI, createLifeCycle, ReadOnlyDataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props.js';
import { ComponentModel, ComponentType } from '../component_model.js';

export interface AurumImageProps extends Omit<CommonProps, 'strokeColor' | 'fillColor'> {
    width?: number | ReadOnlyDataSource<number>;
    height?: number | ReadOnlyDataSource<number>;
    src: string | ReadOnlyDataSource<string>;
}

export interface ImageComponentModel extends ComponentModel {
    opacity?: number | ReadOnlyDataSource<number>;
    width?: number | ReadOnlyDataSource<number>;
    height?: number | ReadOnlyDataSource<number>;
    src: string | ReadOnlyDataSource<string>;
}

export function AurumImage(props: AurumImageProps, children: Renderable[], api: AurumComponentAPI): ImageComponentModel {
    const lc = createLifeCycle();
    api.synchronizeLifeCycle(lc);
    if (props.onAttach) {
        api.onAttach(() => props.onAttach());
    }
    if (props.onDetach) {
        api.onDetach(() => props.onDetach());
    }

    const components = api.prerender(children, lc).filter((c) => !!c);
    return {
        ...props,
        opacity: props.opacity ?? 1,
        renderedState: undefined,
        children: components as any,
        animations: [],
        type: ComponentType.IMAGE
    };
}
