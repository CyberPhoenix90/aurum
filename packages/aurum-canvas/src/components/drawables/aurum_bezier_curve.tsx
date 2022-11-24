import { AurumComponentAPI, createLifeCycle, DataSource, ReadOnlyDataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props.js';
import { ComponentModel, ComponentType } from '../component_model.js';

export interface AurumBezierCurveProps extends CommonProps {
    tx: number | DataSource<number>;
    ty: number | DataSource<number>;
    cx: number | DataSource<number>;
    cy: number | DataSource<number>;
    c2x: number | DataSource<number>;
    c2y: number | DataSource<number>;
    lineWidth?: number | DataSource<number>;
}

export interface BezierCurveComponentModel extends ComponentModel {
    strokeColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    fillColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    opacity?: number | ReadOnlyDataSource<number>;
    cx: number | ReadOnlyDataSource<number>;
    cy: number | ReadOnlyDataSource<number>;
    c2x: number | ReadOnlyDataSource<number>;
    c2y: number | ReadOnlyDataSource<number>;
    tx: number | ReadOnlyDataSource<number>;
    ty: number | ReadOnlyDataSource<number>;
    lineWidth?: number | ReadOnlyDataSource<number>;
}

export function AurumBezierCurve(props: AurumBezierCurveProps, children: Renderable[], api: AurumComponentAPI): BezierCurveComponentModel {
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
        lineWidth: props.lineWidth ?? 1,
        renderedState: undefined,
        children: components as any,
        animations: [],
        type: ComponentType.BEZIER_CURVE
    };
}
