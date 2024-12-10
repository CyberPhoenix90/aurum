import { ReadOnlyDataSource, Renderable, AurumComponentAPI, createLifeCycle, DataSource } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model.js';
import { CommonProps } from '../common_props.js';

export interface AurumRegularPolygonProps extends CommonProps {
    sides: number | ReadOnlyDataSource<number>;
    radius: number | ReadOnlyDataSource<number>;
}

export interface RegularPolygonComponentModel extends ComponentModel {
    strokeColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    fillColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    opacity?: number | ReadOnlyDataSource<number>;
    sides?: number | ReadOnlyDataSource<number>;
    radius?: number | ReadOnlyDataSource<number>;
}

export function AurumRegularPolygon(props: AurumRegularPolygonProps, children: Renderable[], api: AurumComponentAPI): RegularPolygonComponentModel {
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
        readIsHovering: new DataSource(),
        ...props,
        opacity: props.opacity ?? 1,
        renderedState: undefined,
        children: components as any,
        animations: [],
        type: ComponentType.REGULAR_POLYGON
    };
}
