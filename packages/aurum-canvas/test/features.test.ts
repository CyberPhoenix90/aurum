import { CancellationToken, DataSource, EventEmitter } from '@aurumjs/rendering';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeKeyboardPanningFeature, initializeMousePanningFeature, initializeZoomFeature } from '../src/components/features.js';
import { measureText } from '../src/components/measure_text.js';
import { resolveValues } from '../src/components/rendering.js';
import { ComponentModel, ComponentType } from '../src/components/component_model.js';
import { SimplifiedWheelEvent } from '../src/components/common_props.js';
import { StateComponentModel } from '../src/components/drawables/state.js';

describe('canvas features', () => {
    const tokens: CancellationToken[] = [];
    afterEach(() => {
        tokens.splice(0).forEach((token) => token.cancel());
        vi.restoreAllMocks();
    });

    it('clamps zoom and keeps the world position below the pointer stable', () => {
        const wheel = new EventEmitter<SimplifiedWheelEvent>();
        const token = new CancellationToken();
        tokens.push(token);
        const scale = new DataSource({ x: 1, y: 1 });
        const translate = new DataSource({ x: 0, y: 0 });
        const props = {
            scale,
            translate,
            features: { mouseWheelZoom: { zoomIncrements: 2, minZoom: 0.5, maxZoom: 2 } }
        } as any;
        initializeZoomFeature(props, wheel, token);

        wheel.fire(wheelEvent(-1, 10, 20));
        expect(scale.value).toEqual({ x: 2, y: 2 });
        expect(translate.value).toEqual({ x: -5, y: -10 });

        wheel.fire(wheelEvent(-1, 10, 20));
        expect(scale.value).toEqual({ x: 2, y: 2 });

        wheel.fire(wheelEvent(1, 10, 20));
        expect(scale.value).toEqual({ x: 1, y: 1 });
        expect(translate.value).toEqual({ x: 0, y: 0 });
    });

    it('pans with pointer movement in world coordinates and stops on mouse up', () => {
        const down = new EventEmitter<{ clientX: number; clientY: number }>();
        const move = new EventEmitter<{ clientX: number; clientY: number }>();
        const up = new EventEmitter<{ clientX: number; clientY: number }>();
        const token = new CancellationToken();
        tokens.push(token);
        const translate = new DataSource({ x: 3, y: 5 });
        initializeMousePanningFeature(
            { translate, scale: new DataSource({ x: 2, y: 4 }) } as any,
            down,
            move,
            up,
            token
        );

        move.fire({ clientX: 100, clientY: 100 });
        expect(translate.value).toEqual({ x: 3, y: 5 });
        down.fire({ clientX: 10, clientY: 20 });
        move.fire({ clientX: 14, clientY: 28 });
        expect(translate.value).toEqual({ x: 5, y: 7 });

        up.fire({ clientX: 14, clientY: 28 });
        move.fire({ clientX: 30, clientY: 40 });
        expect(translate.value).toEqual({ x: 5, y: 7 });
    });

    it('maps all configured panning keys and cancels movement when keys are released', () => {
        const movementTokens: CancellationToken[] = [];
        vi.spyOn(CancellationToken.prototype, 'animationLoop').mockImplementation(function (this: CancellationToken, callback) {
            movementTokens.push(this);
            callback(0);
        });
        const keyUp = new EventEmitter<{ keyCode: number }>();
        const keyDown = new EventEmitter<{ keyCode: number }>();
        const token = new CancellationToken();
        tokens.push(token);
        const translate = new DataSource({ x: 0, y: 0 });
        const props = {
            translate,
            features: {
                panning: {
                    keyboard: { leftKeyCode: 37, upKeyCode: 38, rightKeyCode: 39, downKeyCode: 40, pixelsPerFrame: 3 }
                }
            }
        } as any;
        initializeKeyboardPanningFeature(props, keyUp, keyDown, token);

        keyDown.fire({ keyCode: 37 });
        expect(translate.value).toEqual({ x: 3, y: 0 });
        keyUp.fire({ keyCode: 37 });
        expect(movementTokens[movementTokens.length - 1]?.isCancelled).toBe(true);
        keyDown.fire({ keyCode: 39 });
        expect(translate.value).toEqual({ x: 0, y: 0 });
        keyUp.fire({ keyCode: 39 });
        keyDown.fire({ keyCode: 38 });
        expect(translate.value).toEqual({ x: 0, y: 3 });
        keyUp.fire({ keyCode: 38 });
        keyDown.fire({ keyCode: 40 });
        expect(translate.value).toEqual({ x: 0, y: 0 });
        keyUp.fire({ keyCode: 40 });
        expect(movementTokens).toHaveLength(4);
        expect(movementTokens.every((movementToken) => movementToken.isCancelled)).toBe(true);

        token.cancel();
        keyDown.fire({ keyCode: 37 });
        expect(translate.value).toEqual({ x: 0, y: 0 });
    });

    it('applies easing and dereferences animated state targets', () => {
        vi.spyOn(Date, 'now').mockReturnValue(50);
        const target = new DataSource(20);
        const state = { width: target, transitionTime: 100, easing: (progress: number) => progress * progress } as StateComponentModel;
        const node = model({ width: 4, animationStates: [state], animationTime: 0 } as Partial<ComponentModel>);

        const resolved = resolveValues(node, ['x', 'y', 'width'], 0, 0);
        expect(resolved.width).toBe(8);
        expect(resolved.idle).toBe(false);
    });

    it('dereferences reactive hover colors', () => {
        const node = model({
            fillColor: 'red',
            hoverFillColor: new DataSource('blue'),
            readIsHovering: new DataSource(true)
        });
        const resolved = resolveValues(node, ['x', 'y', 'fillColor'], 0, 0);
        expect(resolved.fillColor).toBe('blue');
    });

    it('applies origins and parent offsets to endpoints and control points', () => {
        const node = model({
            x: 10,
            y: 20,
            width: 8,
            height: 6,
            originX: 0.5,
            originY: 1,
            tx: 30,
            ty: 40,
            cx: 15,
            cy: 16,
            c2x: 17,
            c2y: 18,
            strokeColor: 'black',
            hoverStrokeColor: new DataSource('orange'),
            readIsHovering: new DataSource(true)
        } as Partial<ComponentModel>);

        expect(resolveValues(node, ['x', 'y', 'width', 'height', 'originX', 'originY', 'tx', 'ty', 'cx', 'cy', 'c2x', 'c2y', 'strokeColor'], 2, 3)).toMatchObject({
            x: 8,
            y: 17,
            tx: 32,
            ty: 43,
            cx: 17,
            cy: 19,
            c2x: 19,
            c2y: 21,
            strokeColor: 'orange',
            idle: true
        });
    });

    it('caches text metrics by font and text', () => {
        const metrics = { width: 42 } as TextMetrics;
        const context = { font: '12px sans-serif', measureText: vi.fn(() => metrics) } as any;

        expect(measureText(context, 'aurum')).toBe(metrics);
        expect(measureText(context, 'aurum')).toBe(metrics);
        context.font = '16px serif';
        expect(measureText(context, 'aurum')).toBe(metrics);
        expect(context.measureText).toHaveBeenCalledTimes(2);
    });
});

function model(overrides: Partial<ComponentModel>): ComponentModel {
    return {
        type: ComponentType.RECTANGLE,
        x: 0,
        y: 0,
        children: [],
        animations: [],
        readIsHovering: new DataSource(false),
        ...overrides
    };
}

function wheelEvent(deltaY: number, offsetX: number, offsetY: number): SimplifiedWheelEvent {
    return {
        button: 0,
        clientX: offsetX,
        clientY: offsetY,
        offsetX,
        offsetY,
        deltaY,
        stoppedPropagation: false,
        stopPropagation() {
            this.stoppedPropagation = true;
        }
    };
}
