import { Renderable } from '../rendering/aurum_element.js';
import { ArrayDataSource, DataSource, ReadOnlyArrayDataSource } from '@aurumjs/streams';
import { CancellationToken } from '@aurumjs/streams';

/**
 * Simplifies the children of a component by resolving the different types of children into an array data source
 */
export function resolveChildren<T>(
    children: Renderable[],
    cancellationToken: CancellationToken,
    validation?: (child: Renderable) => void
): ReadOnlyArrayDataSource<T> {
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
    let currentChunk: T[] = [];
    for (const child of children) {
        if (child instanceof ArrayDataSource) {
            if (currentChunk.length) {
                chunks.push(currentChunk);
                currentChunk = [];
            }
            chunks.push(child as any as ArrayDataSource<T>);
        } else if (child instanceof DataSource) {
            currentChunk.push(child as unknown as T);
        } else if (Array.isArray(child)) {
            if (currentChunk.length) {
                chunks.push(currentChunk);
                currentChunk = [];
            }
            chunks.push(...process<T>(child));
        } else {
            currentChunk.push(child as unknown as T);
        }
    }
    if (currentChunk.length) {
        chunks.push(currentChunk);
    }
    return chunks;
}
