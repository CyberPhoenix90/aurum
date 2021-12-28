import { DataSource, ArrayDataSource } from '../stream/data_source.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { Stream } from '../stream/stream.js';

export function getValueOf<T>(sourceOrPrimitive: T[] | ArrayDataSource<T>): ReadonlyArray<T>;
export function getValueOf<T>(sourceOrPrimitive: T | DataSource<T> | DuplexDataSource<T> | Stream<T>): T;
export function getValueOf<T>(sourceOrPrimitive: T | T[] | DataSource<T> | DuplexDataSource<T> | Stream<T> | ArrayDataSource<T>): T | ReadonlyArray<T> {
    if (sourceOrPrimitive instanceof DataSource || sourceOrPrimitive instanceof DuplexDataSource || sourceOrPrimitive instanceof Stream) {
        return sourceOrPrimitive.value;
    }
    if (sourceOrPrimitive instanceof ArrayDataSource) {
        return sourceOrPrimitive.getData();
    }
    return sourceOrPrimitive;
}
