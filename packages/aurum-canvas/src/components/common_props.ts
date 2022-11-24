import { ReadOnlyDataSource } from 'aurumjs';
import { ComponentModel, RenderData } from './component_model.js';

export enum ColorBlending {
    SOURCE_OVER = 'source-over',
    SOURCE_IN = 'source-in',
    SOURCE_OUT = 'source-out',
    SOURCE_ATOP = 'source-atop',
    DESTINATION_OVER = 'destination-over',
    DESTINATION_IN = 'destination-in',
    DESTINATION_OUT = 'destination-out',
    DESTINATION_ATOP = 'destination-atop',
    LIGHTER = 'lighter',
    COPY = 'copy',
    XOR = 'xor',
    MULTIPLY = 'multiply',
    SCREEN = 'screen',
    OVERLAY = 'overlay',
    DARKEN = 'darken',
    LIGHTEN = 'lighten',
    COLOR_DODGE = 'color-dodge',
    COLOR_BURN = 'color-burn',
    HARD_LIGHT = 'hard-light',
    SOFT_LIGHT = 'soft-light',
    DIFFERENCE = 'difference',
    EXCLUSION = 'exclusion',
    HUE = 'hue',
    SATURATION = 'saturation',
    COLOR = 'color',
    LUMINOSITY = 'luminosity'
}

export interface CommonProps extends InteractionProps {
    onAttach?(): void;
    onDetach?(): void;
    state?: string | ReadOnlyDataSource<string>;
    clip?: boolean | ReadOnlyDataSource<boolean>;
    originX?: number | ReadOnlyDataSource<number>;
    originY?: number | ReadOnlyDataSource<number>;
    x: number | ReadOnlyDataSource<number>;
    y: number | ReadOnlyDataSource<number>;
    strokeColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    fillColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    opacity?: number | ReadOnlyDataSource<number>;
    rotation?: number | ReadOnlyDataSource<number>;
    colorBlending?: ColorBlending | ReadOnlyDataSource<ColorBlending>;
    onPreDraw?(props: RenderData);
}

export interface InteractionProps {
    onMouseEnter?(e: MouseEvent, target: ComponentModel): void;
    onMouseLeave?(e: MouseEvent, target: ComponentModel): void;
    onMouseDown?(e: MouseEvent, target: ComponentModel): void;
    onMouseUp?(e: MouseEvent, target: ComponentModel): void;
    onMouseClick?(e: MouseEvent, target: ComponentModel): void;
    onMouseMove?(e: MouseEvent, target: ComponentModel): void;
}
