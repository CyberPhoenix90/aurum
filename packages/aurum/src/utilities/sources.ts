import { DataSource, ArrayDataSource, MapDataSource } from '../stream/data_source.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { ObjectDataSource } from '../stream/object_data_source.js';
import { Stream } from '../stream/stream.js';

export type Data<T> = T | DataSource<T>;
export type DataArray<T> = T[] | ArrayDataSource<T>;
export type DataObject<T> = T | ObjectDataSource<T>;
export type DataMap<T> = Map<string, T> | MapDataSource<string, T>;

export function getValueOf<T>(sourceOrPrimitive: DataArray<T>): ReadonlyArray<T>;
export function getValueOf<T>(sourceOrPrimitive: Data<T> | DuplexDataSource<T> | Stream<T>): T;
export function getValueOf<T>(sourceOrPrimitive: Data<T> | DataArray<T> | DuplexDataSource<T> | Stream<T>): T | ReadonlyArray<T> {
    if (sourceOrPrimitive instanceof DataSource || sourceOrPrimitive instanceof DuplexDataSource || sourceOrPrimitive instanceof Stream) {
        return sourceOrPrimitive.value;
    }
    if (sourceOrPrimitive instanceof ArrayDataSource) {
        return sourceOrPrimitive.getData();
    }
    return sourceOrPrimitive;
}
