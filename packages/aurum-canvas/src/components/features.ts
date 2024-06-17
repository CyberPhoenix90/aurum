import { CancellationToken, EventEmitter } from 'aurumjs';
import { AurumCanvasProps } from './canvas.js';

export function initializeKeyboardPanningFeature(
    props: AurumCanvasProps,
    onKeyUp: EventEmitter<{ keyCode: number }>,
    onKeyDown: EventEmitter<{ keyCode: number }>,
    token: CancellationToken
): void {
    let moveToken: CancellationToken;
    const keyDown = new Set();
    const moveVector = {
        x: 0,
        y: 0
    };

    onKeyUp.subscribe((e) => {
        if (e.keyCode === props.features.panning.keyboard.leftKeyCode || e.keyCode === props.features.panning.keyboard.rightKeyCode) {
            moveVector.x = 0;
            keyDown.delete(e.keyCode);
        }

        if (e.keyCode === props.features.panning.keyboard.upKeyCode || e.keyCode === props.features.panning.keyboard.downKeyCode) {
            moveVector.y = 0;
            keyDown.delete(e.keyCode);
        }

        if (moveToken && keyDown.size === 0) {
            moveToken.cancel();
            moveToken = undefined;
        }
    }, token);

    onKeyDown.subscribe((e) => {
        if (e.keyCode === props.features.panning.keyboard.leftKeyCode) {
            moveVector.x = props.features.panning.keyboard.pixelsPerFrame;
            keyDown.add(e.keyCode);
        }

        if (e.keyCode === props.features.panning.keyboard.downKeyCode) {
            moveVector.y = -props.features.panning.keyboard.pixelsPerFrame;
            keyDown.add(e.keyCode);
        }

        if (e.keyCode === props.features.panning.keyboard.rightKeyCode) {
            moveVector.x = -props.features.panning.keyboard.pixelsPerFrame;
            keyDown.add(e.keyCode);
        }

        if (e.keyCode === props.features.panning.keyboard.upKeyCode) {
            moveVector.y = props.features.panning.keyboard.pixelsPerFrame;
            keyDown.add(e.keyCode);
        }

        if (!moveToken && keyDown.size > 0) {
            moveToken = new CancellationToken();
            moveToken.animationLoop(() => {
                props.translate.update({
                    x: props.translate.value.x + moveVector.x,
                    y: props.translate.value.y + moveVector.y
                });
            });
        }
    }, token);
}

export function initializeMousePanningFeature(
    props: AurumCanvasProps,
    onMouseDown: EventEmitter<{ clientX: number; clientY: number }>,
    onMouseMove: EventEmitter<{ clientX: number; clientY: number }>,
    onMouseUp: EventEmitter<{ clientX: number; clientY: number }>,
    token: CancellationToken
): void {
    let downX: number;
    let downY: number;
    let beforeX: number;
    let beforeY: number;
    let down: boolean = false;

    onMouseDown.subscribe((e) => {
        downX = e.clientX;
        downY = e.clientY;
        beforeX = props.translate.value.x;
        beforeY = props.translate.value.y;
        down = true;
    }, token);

    onMouseMove.subscribe((e) => {
        if (down) {
            props.translate.update({
                x: beforeX - (downX - e.clientX) / props.scale.value.x,
                y: beforeY - (downY - e.clientY) / props.scale.value.y
            });
        }
    }, token);

    onMouseUp.subscribe((e) => {
        down = false;
    }, token);
}

export function initializeZoomFeature(
    props: AurumCanvasProps,
    onWheel: EventEmitter<{ offsetX: number; offsetY: number; deltaY: number }>,
    token: CancellationToken
): void {
    onWheel.subscribe((e) => {
        if (e.deltaY > 0) {
            if (props.scale.value.x < props.features.mouseWheelZoom.minZoom) {
                return;
            }

            props.translate.update({
                x: props.translate.value.x + (e.offsetX * (props.features.mouseWheelZoom.zoomIncrements - 1)) / props.scale.value.x,
                y: props.translate.value.y + (e.offsetY * (props.features.mouseWheelZoom.zoomIncrements - 1)) / props.scale.value.y
            });
            props.scale.update({
                x: props.scale.value.x / props.features.mouseWheelZoom.zoomIncrements,
                y: props.scale.value.y / props.features.mouseWheelZoom.zoomIncrements
            });
        } else {
            if (props.scale.value.x > props.features.mouseWheelZoom.maxZoom) {
                return;
            }

            props.scale.update({
                x: props.scale.value.x * props.features.mouseWheelZoom.zoomIncrements,
                y: props.scale.value.y * props.features.mouseWheelZoom.zoomIncrements
            });
            props.translate.update({
                x: props.translate.value.x - (e.offsetX * (props.features.mouseWheelZoom.zoomIncrements - 1)) / props.scale.value.x,
                y: props.translate.value.y - (e.offsetY * (props.features.mouseWheelZoom.zoomIncrements - 1)) / props.scale.value.y
            });
        }
    }, token);
}
