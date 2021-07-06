import { AurumComponentAPI, createLifeCycle, ReadOnlyDataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumLineProps extends CommonProps {
    tx: number | ReadOnlyDataSource<number>;
    ty: number | ReadOnlyDataSource<number>;
    lineWidth?: number | ReadOnlyDataSource<number>;
}

export interface LineComponentModel extends ComponentModel {
    strokeColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    fillColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    opacity?: number | ReadOnlyDataSource<number>;
    tx: number | ReadOnlyDataSource<number>;
    ty: number | ReadOnlyDataSource<number>;
    lineWidth?: number | ReadOnlyDataSource<number>;
}

export function AurumLine(props: AurumLineProps, children: Renderable[], api: AurumComponentAPI): LineComponentModel {
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
        type: ComponentType.LINE
    };
}
