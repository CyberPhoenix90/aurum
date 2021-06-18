import { Renderable } from '../rendering/aurum_element';
import { ArrayDataSource, DataSource } from '../stream/data_source';
import { CancellationToken } from './cancellation_token';

export function resolveChildren<T>(children: Renderable[], cancellationToken: CancellationToken, validation?: (child: Renderable) => void): ArrayDataSource<T> {
	const chunks: Array<ArrayDataSource<T> | T[]> = process<T>(children);
	const result = ArrayDataSource.fromMultipleSources(chunks, cancellationToken);

	if (validation) {
		result.listen((c) => {
			switch (c.operation) {
				case 'add':
				case 'replace':
				case 'merge':
					for (const item of c.items) {
						validation(item as any);
					}
					break;
			}
		}, cancellationToken);
	}

	return result;
}

function process<T>(children: Renderable[]): Array<ArrayDataSource<T> | T[]> {
	const chunks: Array<ArrayDataSource<T> | T[]> = [];
	let currentChunk = [];
	for (const child of children) {
		if (child instanceof ArrayDataSource) {
			if (currentChunk.length) {
				chunks.push(currentChunk);
				currentChunk.length = 0;
			}
			chunks.push((child as any) as ArrayDataSource<T>);
		} else if (child instanceof DataSource) {
			currentChunk.push(child);
		} else if (child instanceof DataSource) {
			currentChunk.push(child);
		} else if (child instanceof DataSource) {
			currentChunk.push(child);
		} else if (Array.isArray(child)) {
			chunks.push(...process<T>(child));
		} else {
			currentChunk.push(child);
		}
	}
	if (currentChunk.length) {
		chunks.push(currentChunk);
	}
	return chunks;
}
