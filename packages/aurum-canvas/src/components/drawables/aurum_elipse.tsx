import { AurumComponentAPI, createLifeCycle, ReadOnlyDataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumElipseProps extends CommonProps {
    rx: number | ReadOnlyDataSource<number>;
    ry: number | ReadOnlyDataSource<number>;
    startAngle?: number | ReadOnlyDataSource<number>;
    endAngle?: number | ReadOnlyDataSource<number>;
}

export interface ElipseComponentModel extends ComponentModel {
    strokeColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    fillColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    opacity?: number | ReadOnlyDataSource<number>;
    rx: number | ReadOnlyDataSource<number>;
    ry: number | ReadOnlyDataSource<number>;
    rotation?: number | ReadOnlyDataSource<number>;
    startAngle?: number | ReadOnlyDataSource<number>;
    endAngle?: number | ReadOnlyDataSource<number>;
}

export function AurumElipse(props: AurumElipseProps, children: Renderable[], api: AurumComponentAPI): ElipseComponentModel {
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
        type: ComponentType.ELIPSE
    };
}
