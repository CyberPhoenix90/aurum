import { DataSource } from "../stream/data_source";
export declare type Callback<T> = (data?: T) => void;
export declare type Delegate = () => void;
export declare type Predicate<T> = (data: T) => boolean;
export declare type Provider<T> = () => T;
export declare type Comparator<T1, T2> = (value1: T1, value2: T2) => boolean;
export declare type Constructor<T> = new (...args: any[]) => T;
export declare type MapLike<T> = {
    [key: string]: T;
};
export declare type Primitive = number | string | boolean | null | undefined;
export declare type JSONObject<T> = {
    [key: string]: T | JSONObject<T>;
};
export declare type ValueOrProvider<T> = T | Provider<T>;
export declare type ValueOrArray<T> = T | T[];
export interface PointLike {
    x: number;
    y: number;
}
export declare type DataDrain<T> = Callback<T> | DataSource<T>;
//# sourceMappingURL=common.d.ts.map