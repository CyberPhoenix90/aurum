import { CancellationToken, EventEmitter } from '@aurum/rendering';
import { AurumOffscreenCanvasProps } from './offscreen_canvas.js';

export function initializeKeyboardPanningFeature(
    props: AurumOffscreenCanvasProps,
    onKeyUp: EventEmitter<{ keyCode: number }>,
    onKeyDown: EventEmitter<{ keyCode: number }>,
    token: CancellationToken
): void {
    let moveToken: CancellationToken;
    const keyDown = new Set<number>();
    const moveVector = {
        x: 0,
        y: 0
    };
    token.addCancellable(() => moveToken?.cancel());

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
    props: AurumOffscreenCanvasProps,
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
    props: AurumOffscreenCanvasProps,
    onWheel: EventEmitter<{ offsetX: number; offsetY: number; deltaY: number }>,
    token: CancellationToken
): void {
    onWheel.subscribe((e) => {
        const oldScale = props.scale.value;
        const zoomFactor = e.deltaY > 0 ? 1 / props.features.mouseWheelZoom.zoomIncrements : props.features.mouseWheelZoom.zoomIncrements;
        const newScale = {
            x: Math.min(props.features.mouseWheelZoom.maxZoom, Math.max(props.features.mouseWheelZoom.minZoom, oldScale.x * zoomFactor)),
            y: Math.min(props.features.mouseWheelZoom.maxZoom, Math.max(props.features.mouseWheelZoom.minZoom, oldScale.y * zoomFactor))
        };
        if (newScale.x === oldScale.x && newScale.y === oldScale.y) {
            return;
        }

        const worldX = e.offsetX / oldScale.x - props.translate.value.x;
        const worldY = e.offsetY / oldScale.y - props.translate.value.y;
        props.scale.update(newScale);
        props.translate.update({
            x: e.offsetX / newScale.x - worldX,
            y: e.offsetY / newScale.y - worldY
        });
    }, token);
}
