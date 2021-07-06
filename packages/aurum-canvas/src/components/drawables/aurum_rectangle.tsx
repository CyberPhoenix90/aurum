import { AurumComponentAPI, createLifeCycle, ReadOnlyDataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumRectangleProps extends CommonProps {
    width: number | ReadOnlyDataSource<number>;
    height: number | ReadOnlyDataSource<number>;
}

export interface RectangleComponentModel extends ComponentModel {
    strokeColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    fillColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    opacity?: number | ReadOnlyDataSource<number>;
    width: number | ReadOnlyDataSource<number>;
    height: number | ReadOnlyDataSource<number>;
}

export function AurumRectangle(props: AurumRectangleProps, children: Renderable[], api: AurumComponentAPI): RectangleComponentModel {
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
        type: ComponentType.RECTANGLE
    };
}
