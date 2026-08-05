import { CancellationToken, DataSource, EventEmitter } from '@aurum/rendering';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeZoomFeature } from '../src/components/features.js';
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
