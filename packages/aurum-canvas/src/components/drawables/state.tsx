import { DataSource, Renderable, AurumComponentAPI, createLifeCycle } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model.js';
export const stateSymbol = Symbol('state');

export interface StateProps {
    id: string;
    state?: string | DataSource<string>;
    width?: number | DataSource<number>;
    height?: number | DataSource<number>;
    x?: number | DataSource<number>;
    y?: number | DataSource<number>;
    rx?: number | DataSource<number>;
    ry?: number | DataSource<number>;
    strokeColor?: string | DataSource<string>;
    fillColor?: string | DataSource<string>;
    opacity?: number | DataSource<number>;
    rotation?: number | DataSource<number>;
    startAngle?: number | DataSource<number>;
    endAngle?: number | DataSource<number>;
    transitionTime?: number | DataSource<number>;
    easing?: (t: number) => number;
    fontSize?: number | DataSource<number>;
    font?: string | DataSource<string>;
}

export interface StateComponentModel extends ComponentModel {
    [stateSymbol]: boolean;
    id: string;
    state?: string | DataSource<string>;
    rx?: number | DataSource<number>;
    ry?: number | DataSource<number>;
    width?: number | DataSource<number>;
    height?: number | DataSource<number>;
    strokeColor?: string | DataSource<string>;
    fillColor?: string | DataSource<string>;
    opacity?: number | DataSource<number>;
    rotation?: number | DataSource<number>;
    startAngle?: number | DataSource<number>;
    easing?: (t: number) => number;
    endAngle?: number | DataSource<number>;
    transitionTime?: number | DataSource<number>;
    fontSize?: number | DataSource<number>;
    font?: string | DataSource<string>;
}

export function State(props: StateProps, children: Renderable[], api: AurumComponentAPI): StateComponentModel {
    const lc = createLifeCycle();
    api.synchronizeLifeCycle(lc);

    const components = api.prerender(children, lc);
    return {
        readIsHovering: new DataSource(),
        [stateSymbol]: true,
        x: undefined,
        y: undefined,
        ...props,
        renderedState: undefined,

        animations: [],
        children: components as any,
        type: ComponentType.STATE
    };
}
