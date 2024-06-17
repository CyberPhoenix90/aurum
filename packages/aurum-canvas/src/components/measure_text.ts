const cache = new Map<string, Map<string, TextMetrics>>();

export function measureText(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string): TextMetrics {
    const font = context.font;
    const fontCache = cache.get(font) ?? new Map<string, TextMetrics>();
    cache.set(font, fontCache);
    let metrics = fontCache.get(text);
    if (!metrics) {
        metrics = context.measureText(text);
        fontCache.set(text, metrics);
    }
    return metrics;
}
