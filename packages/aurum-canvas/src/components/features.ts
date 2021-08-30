import { CancellationToken } from 'aurumjs';
import { AurumCanvasProps } from './canvas';

export function initializeKeyboardPanningFeature(props: AurumCanvasProps, canvas: HTMLCanvasElement): void {
    let moveToken: CancellationToken;
    const keyDown = new Set();
    const moveVector = {
        x: 0,
        y: 0
    };

    window.addEventListener('keyup', (e) => {
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
    });

    window.addEventListener('keydown', (e) => {
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
    });
}

export function initializeMousePanningFeature(props: AurumCanvasProps, canvas: HTMLCanvasElement): void {
    let downX: number;
    let downY: number;
    let beforeX: number;
    let beforeY: number;
    let down: boolean = false;

    canvas.addEventListener('mousedown', (e) => {
        downX = e.clientX;
        downY = e.clientY;
        beforeX = props.translate.value.x;
        beforeY = props.translate.value.y;
        down = true;
    });

    document.addEventListener('mousemove', (e) => {
        if (down) {
            props.translate.update({
                x: beforeX - (downX - e.clientX) / props.scale.value.x,
                y: beforeY - (downY - e.clientY) / props.scale.value.y
            });
        }
    });

    document.addEventListener('mouseup', (e) => {
        down = false;
    });
}

export function initializeZoomFeature(props: AurumCanvasProps, canvas: HTMLCanvasElement): void {
    canvas.addEventListener('wheel', (e) => {
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
    });
}
