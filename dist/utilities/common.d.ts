import { DataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
export declare type AttributeValue = string | DataSource<string> | DataSource<boolean> | boolean;
export declare type StringSource = string | DataSource<string>;
export declare type ClassType = string | DataSource<string> | DataSource<string[]> | Array<string | DataSource<string>>;
export declare type Callback<T> = (data?: T) => void;
export declare type Delegate = () => void;
export declare type Predicate<T> = (data: T) => boolean;
export declare type Provider<T> = () => T;
export declare type Comparator<T1, T2> = (value1: T1, value2: T2) => boolean;
export declare type Constructor<T> = new (...args: any[]) => T;
export declare type MapLike<T> = {
    [key: string]: T;
};
export declare type DataDrain<T> = Callback<T> | DataSource<T> | DuplexDataSource<T>;
export declare type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
//# sourceMappingURL=common.d.ts.map