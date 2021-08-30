import { ReadOnlyDataSource } from 'aurumjs';
import { InteractionProps } from './common_props';
import { StateComponentModel } from './drawables/state';

export interface ComponentModel extends InteractionProps {
    type: ComponentType;
    state?: string | ReadOnlyDataSource<string>;
    clip?: boolean | ReadOnlyDataSource<boolean>;
    x: number | ReadOnlyDataSource<number>;
    y: number | ReadOnlyDataSource<number>;
    children: ComponentModel[];
    animationStates?: StateComponentModel[];
    animationTime?: number;
    animations: StateComponentModel[];
    renderedState?: RenderData;
    onPreDraw?(props: RenderData);
}

export interface RenderData {
    radius: number;
    path: Path2D;
    lines: string[];
    x: number;
    y: number;
    realWidth?:number;
    width?: number;
    height?: number;
    tx?: number;
    ty?: number;
    strokeColor?: string;
    fillColor?: string;
    rx?: number;
    ry?: number;
    originX?: number;
    originY?: number;
    opacity?: number;
    rotation?: number;
    lineThickness?: number;
    fontSize?: number;
    font?: string;
}

export enum ComponentType {
    RECTANGLE,
    ELIPSE,
    LINE,
    TEXT,
    IMAGE,
    GROUP,
    STATE,
    PATH,
    QUADRATIC_CURVE,
    BEZIER_CURVE,
    REGULAR_POLYGON
}
