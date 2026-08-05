import { DataSource } from '@aurum/rendering';
import { ComponentType } from '../src/components/component_model.js';
import { RectangleComponentModel } from '../src/components/drawables/aurum_rectangle.js';
import { renderRectangle } from '../src/components/rendering.js';

const context = {
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    fillRect() {},
    strokeRect() {},
    beginPath() {},
    rect() {},
    clip() {}
} as unknown as CanvasRenderingContext2D;

for (const size of [1_000, 10_000]) {
    const scene = createScene(size);
    benchmark(`resolve and draw ${size.toLocaleString()} rectangles`, () => {
        for (const rectangle of scene) {
            renderRectangle(context, rectangle, 0, 0);
        }
    });
}

function createScene(size: number): RectangleComponentModel[] {
    const hovering = new DataSource(false);
    return Array.from({ length: size }, (_, index): RectangleComponentModel => ({
        type: ComponentType.RECTANGLE,
        x: index % 100,
        y: Math.floor(index / 100),
        width: 4,
        height: 4,
        fillColor: '#000',
        opacity: 1,
        children: [],
        animations: [],
        readIsHovering: hovering
    }));
}

function benchmark(label: string, operation: () => void): void {
    for (let index = 0; index < 10; index++) {
        operation();
    }
    const samples: number[] = [];
    for (let index = 0; index < 50; index++) {
        const start = performance.now();
        operation();
        samples.push(performance.now() - start);
    }
    samples.sort((left, right) => left - right);
    const median = samples[Math.floor(samples.length / 2)];
    const p95 = samples[Math.floor(samples.length * 0.95)];
    console.log(`${label}: median ${median.toFixed(3)} ms, p95 ${p95.toFixed(3)} ms`);
}
