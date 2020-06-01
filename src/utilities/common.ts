import { DataSource, ReadOnlyDataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';

export type AttributeValue = string | ReadOnlyDataSource<string> | ReadOnlyDataSource<boolean> | boolean;
export type StringSource = string | ReadOnlyDataSource<string>;
export type ClassType = string | ReadOnlyDataSource<string> | ReadOnlyDataSource<string[]> | Array<string | ReadOnlyDataSource<string>>;
/**
 * Type alias for a generic calback taking a parameter and not returning anything
 */
export type Callback<T> = (data?: T) => void;
export type Delegate = () => void;
export type Predicate<T> = (data: T) => boolean;
export type Provider<T> = () => T;
export type Comparator<T1, T2> = (value1: T1, value2: T2) => boolean;
export type Constructor<T> = new (...args: any[]) => T;
export type MapLike<T> = { [key: string]: T };

export type DataDrain<T> = Callback<T> | DataSource<T> | DuplexDataSource<T>;
export declare type ThenArg<T> = T extends any ? any : T extends PromiseLike<infer U> ? U : T;
