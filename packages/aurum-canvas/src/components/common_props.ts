import { DataSource, ReadOnlyDataSource } from 'aurumjs';
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
    readWidth?: DataSource<number>;
    readHeight?: DataSource<number>;
    readIsHovering?: DataSource<boolean>;
    state?: string | ReadOnlyDataSource<string>;
    clip?: boolean | ReadOnlyDataSource<boolean>;
    originX?: number | ReadOnlyDataSource<number>;
    originY?: number | ReadOnlyDataSource<number>;
    x: number | ReadOnlyDataSource<number>;
    y: number | ReadOnlyDataSource<number>;
    strokeColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    fillColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    hoverFillColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    hoverStrokeColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    cursor?: string | ReadOnlyDataSource<string>;
    opacity?: number | ReadOnlyDataSource<number>;
    rotation?: number | ReadOnlyDataSource<number>;
    colorBlending?: ColorBlending | ReadOnlyDataSource<ColorBlending>;
    onPreDraw?(props: RenderData);
}

export interface InteractionProps {
    onMouseEnter?(e: SimplifiedMouseEvent, target: ComponentModel): void;
    onMouseLeave?(e: SimplifiedMouseEvent, target: ComponentModel): void;
    onMouseDown?(e: SimplifiedMouseEvent, target: ComponentModel): void;
    onMouseUp?(e: SimplifiedMouseEvent, target: ComponentModel): void;
    onMouseClick?(e: SimplifiedMouseEvent, target: ComponentModel): void;
    onMouseMove?(e: SimplifiedMouseEvent, target: ComponentModel): void;
}

export interface VirtualEvents {
    stoppedPropagation: boolean;
    stopPropagation(): void;
}

export interface SimplifiedMouseEvent extends VirtualEvents {
    button: number;
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
}

export interface SimplifiedKeyboardEvent extends VirtualEvents {
    key: string;
    keyCode: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
}

export interface SimplifiedWheelEvent extends SimplifiedMouseEvent {
    deltaY: number;
}
