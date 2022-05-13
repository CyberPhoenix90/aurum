export function clamp(value: number, min: number, max: number): number {
	return Math.max(Math.min(value, max), min);
}

export function lerp(start: number, end: number, progress: number): number {
	return customInterpolation(start, end, progress, (i) => i);
}

export function customInterpolation(start: number, end: number, progress: number, easing: (progress: number) => number): number {
	const diff: number = end - start;
	return start + diff * easing(progress);
}
