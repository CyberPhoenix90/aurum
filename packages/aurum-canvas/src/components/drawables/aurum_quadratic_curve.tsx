import { AurumComponentAPI, createLifeCycle, DataSource, ReadOnlyDataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props.js';
import { ComponentModel, ComponentType } from '../component_model.js';

export interface AurumQuadraticCurveProps extends CommonProps {
    tx: number | ReadOnlyDataSource<number>;
    ty: number | ReadOnlyDataSource<number>;
    cx: number | ReadOnlyDataSource<number>;
    cy: number | ReadOnlyDataSource<number>;
    lineWidth?: number | ReadOnlyDataSource<number>;
}

export interface QuadraticCurveComponentModel extends ComponentModel {
    strokeColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    fillColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    opacity?: number | ReadOnlyDataSource<number>;
    cx: number | ReadOnlyDataSource<number>;
    cy: number | ReadOnlyDataSource<number>;
    tx: number | ReadOnlyDataSource<number>;
    ty: number | ReadOnlyDataSource<number>;
    lineWidth?: number | ReadOnlyDataSource<number>;
}

export function AurumQuadraticCurve(props: AurumQuadraticCurveProps, children: Renderable[], api: AurumComponentAPI): QuadraticCurveComponentModel {
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
        lineWidth: props.lineWidth ?? 1,
        renderedState: undefined,
        children: components as any,
        animations: [],
        type: ComponentType.QUADRATIC_CURVE
    };
}
