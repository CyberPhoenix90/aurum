import { ObjectDataSource } from '../aurumjs.js';
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

export type UnwrapObjectRecursive<T> = T extends ArrayDataSource<infer U>
    ? UnwrapObjectRecursive<U[]>
    : T extends DataSource<infer U>
    ? UnwrapObjectRecursive<U>
    : T extends DuplexDataSource<infer U>
    ? UnwrapObjectRecursive<U>
    : T extends ObjectDataSource<infer U>
    ? UnwrapObjectRecursive<U>
    : T extends Stream<infer U>
    ? UnwrapObjectRecursive<U>
    : {
          [K in keyof T]: T[K] extends DataSource<infer U>
              ? UnwrapObjectRecursive<U>
              : T[K] extends DuplexDataSource<infer U>
              ? UnwrapObjectRecursive<U>
              : T[K] extends Stream<infer U>
              ? UnwrapObjectRecursive<U>
              : T[K] extends ObjectDataSource<infer U>
              ? UnwrapObjectRecursive<U>
              : T[K] extends object
              ? UnwrapObjectRecursive<T[K]>
              : T[K];
      };

export function unwrapObjectRecursive<T>(object: T): UnwrapObjectRecursive<T> {
    if (object instanceof DataSource || object instanceof DuplexDataSource || object instanceof Stream) {
        //@ts-ignore
        return unwrapObjectRecursive(object.value);
    }
    if (object instanceof ArrayDataSource) {
        //@ts-ignore
        return unwrapObjectRecursive(object.toArray());
    }
    if (object instanceof ObjectDataSource) {
        //@ts-ignore
        return unwrapObjectRecursive(object.getData());
    }
    if (object instanceof DuplexDataSource) {
        //@ts-ignore
        return unwrapObjectRecursive(object.value);
    }
    if (object instanceof Stream) {
        //@ts-ignore
        return unwrapObjectRecursive(object.value);
    }
    if (Array.isArray(object)) {
        //@ts-ignore
        return object.map(unwrapObjectRecursive);
    }
    if (object instanceof Object) {
        const result: any = {};
        for (const key in object) {
            result[key] = unwrapObjectRecursive(object[key]);
        }
        return result;
    }
    //@ts-ignore
    return object;
}
