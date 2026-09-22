import { afterEach, describe, expect, it, vi } from 'vitest';
import { measureText } from '../src/components/measure_text.js';
import { renderImage } from '../src/components/rendering.js';
import { ImageComponentModel } from '../src/components/drawables/aurum_image.js';

class TestImage extends EventTarget {
    static created: TestImage[] = [];
    public src = '';
    public naturalWidth = 10;
    public naturalHeight = 20;
    constructor() { super(); TestImage.created.push(this); }
}

function node(src: string): ImageComponentModel {
    return { src, x: 0, y: 0, opacity: 1 } as ImageComponentModel;
}

function imageContext() {
    return { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
}

afterEach(() => vi.unstubAllGlobals());

describe('bounded canvas caches', () => {
    it('evicts cold labels while retaining recently measured text', () => {
        const measure = vi.fn(() => ({ width: 10 } as TextMetrics));
        const context = { font: '16px label-cache-test', measureText: measure } as unknown as CanvasRenderingContext2D;
        measureText(context, 'cold');
        measureText(context, 'hot');
        for (let index = 0; index < 254; index++) measureText(context, String(index));
        measureText(context, 'hot');
        expect(measure).toHaveBeenCalledTimes(256);
        measureText(context, 'overflow');
        measureText(context, 'hot');
        expect(measure).toHaveBeenCalledTimes(257);
        measureText(context, 'cold');
        expect(measure).toHaveBeenCalledTimes(258);
    });

    it('bounds the number of cached fonts as well as labels', () => {
        const measure = vi.fn(() => ({ width: 10 } as TextMetrics));
        const context = { font: '', measureText: measure } as unknown as CanvasRenderingContext2D;
        for (let index = 0; index < 33; index++) {
            context.font = `${index + 10}px font-cache-test`;
            measureText(context, 'label');
        }
        context.font = '42px font-cache-test';
        measureText(context, 'label');
        expect(measure).toHaveBeenCalledTimes(33);
        context.font = '10px font-cache-test';
        measureText(context, 'label');
        expect(measure).toHaveBeenCalledTimes(34);
    });

    it('bounds shared images while keeping evicted images usable by live nodes', () => {
        vi.stubGlobal('Image', TestImage);
        TestImage.created = [];
        const context = imageContext();
        const invalidate = vi.fn();
        const first = node('cache-limit:first');
        renderImage(context, first, 0, 0, invalidate);
        const firstImage = TestImage.created[0];
        firstImage.dispatchEvent(new Event('load'));
        for (let index = 0; index < 128; index++) renderImage(context, node(`cache-limit:${index}`), 0, 0, invalidate);
        expect(TestImage.created).toHaveLength(129);
        renderImage(context, first, 0, 0, invalidate);
        expect(TestImage.created).toHaveLength(129);
        expect(context.drawImage).toHaveBeenCalledWith(firstImage, 0, 0, 10, 20);
        renderImage(context, node('cache-limit:first'), 0, 0, invalidate);
        expect(TestImage.created).toHaveLength(130);
        // Another node reloading the same URL must not blank out the live node.
        renderImage(context, first, 0, 0, invalidate);
        expect(context.drawImage).toHaveBeenCalledTimes(2);
    });

    it('keeps hot shared images and notifies waiting canvases after eviction', () => {
        vi.stubGlobal('Image', TestImage);
        TestImage.created = [];
        const context = imageContext();
        const firstInvalidation = vi.fn();
        const secondInvalidation = vi.fn();
        const first = node('pending:first');
        renderImage(context, first, 0, 0, firstInvalidation);
        const pendingImage = TestImage.created[0];
        renderImage(context, node('pending:first'), 0, 0, secondInvalidation);
        expect(TestImage.created).toHaveLength(1);
        for (let index = 0; index < 140; index++) {
            renderImage(context, node(`pending:${index}`), 0, 0, firstInvalidation);
            renderImage(context, node('pending:hot'), 0, 0, firstInvalidation);
        }
        expect(TestImage.created.filter((image) => image.src === 'pending:hot')).toHaveLength(1);
        renderImage(context, first, 0, 0, firstInvalidation);
        pendingImage.dispatchEvent(new Event('load'));
        expect(firstInvalidation).toHaveBeenCalledTimes(1);
        expect(secondInvalidation).toHaveBeenCalledTimes(1);
        renderImage(context, first, 0, 0, firstInvalidation);
        expect(context.drawImage).toHaveBeenCalledWith(pendingImage, 0, 0, 10, 20);
    });

    it('releases a node\'s old image when its source changes or is cleared', () => {
        vi.stubGlobal('Image', TestImage);
        TestImage.created = [];
        const context = imageContext();
        const first = node('source:first');
        renderImage(context, first, 0, 0, () => {});
        first.src = 'source:second';
        renderImage(context, first, 0, 0, () => {});
        expect(TestImage.created.map((image) => image.src)).toEqual(['source:first', 'source:second']);
        first.src = '';
        renderImage(context, first, 0, 0, () => {});
        for (let index = 0; index < 128; index++) renderImage(context, node(`source:${index}`), 0, 0, () => {});
        first.src = 'source:second';
        renderImage(context, first, 0, 0, () => {});
        expect(TestImage.created.filter((image) => image.src === 'source:second')).toHaveLength(2);
    });
});
