import { LruCache } from './lru_cache.js';

// Bound both dimensions: animated font sizes and frequently changing labels.
const cache = new LruCache<string, LruCache<string, TextMetrics>>(32);

export function measureText(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string): TextMetrics {
    const font = context.font;
    let fontCache = cache.get(font);
    if (!fontCache) {
        fontCache = new LruCache<string, TextMetrics>(256);
        cache.set(font, fontCache);
    }
    let metrics = fontCache.get(text);
    if (!metrics) {
        metrics = context.measureText(text);
        fontCache.set(text, metrics);
    }
    return metrics;
}
