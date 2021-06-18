import { ReadonlyData, Data } from '../../models/input_data';
import { DataSource, DuplexDataSource, Stream } from 'aurumjs';
import { MapLike } from '../../models/common';

export interface TrimObjectOptions {
	NaN?: boolean;
	undefined?: boolean;
	null?: boolean;
	emptyString?: boolean;
}

export interface Comparator<T> {
	(a: T, b: T): number;
}

const defaultCmp: Comparator<any> = (a, b) => {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
};

export class StreamLine {
	private static idRoot: number = 0;

	public getId(): number {
		return StreamLine.idRoot++;
	}

	public getIdString(): string {
		return this.getId().toString();
	}

	public getUId(): number {
		//@ts-ignore
		return StreamLine.idRoot++ + Math.random() * performance.now() * performance?.memory?.usedJSHeapSize;
	}

	public getUIdString(): string {
		return Math.floor(this.getUId() * 0xff).toString(16);
	}

	public static chunk<T>(array: T[], chunkSize: number): T[][] {
		const result: T[][] = [];
		for (let i: number = 0, length: number = array.length; i < length; i += chunkSize) {
			result.push(array.slice(i, i + chunkSize));
		}
		return result;
	}

	public static intersection<T>(first: T[], second: T[]): T[] {
		return first.filter((i) => second.includes(i));
	}

	public assignRecursive<T>(...dataSources: T[]): T {
		dataSources
			.map((i) => Object.keys(i))
			.flat()
			.filter((k, i, arr) => arr.lastIndexOf(k) === i)
			.forEach((key) => {
				for (let i: number = 1; i < dataSources.length; i++) {
					if (
						typeof dataSources[0][key] === 'object' &&
						typeof dataSources[i][key] === 'object' &&
						dataSources[i][key] !== null &&
						dataSources[0][key] !== null
					) {
						this.assignRecursive(dataSources[0][key], dataSources[i][key]);
					} else if (typeof dataSources[0][key] === 'undefined' && typeof dataSources[i][key] === 'object') {
						dataSources[0][key] = {};
						this.assignRecursive(dataSources[0][key], dataSources[i][key]);
					} else if (key in dataSources[i]) {
						dataSources[0][key] = dataSources[i][key];
					}
				}
			});

		return dataSources[0];
	}

	public extendFunction<T extends Function>(original: T, modifications: { preFunction?: Function; postFunction?: Function }): T {
		return (function(...args: any[]) {
			if (modifications.preFunction) {
				modifications.preFunction.apply(this, args);
			}

			original.apply(this, args);

			if (modifications.postFunction) {
				modifications.postFunction.apply(this, args);
			}
		} as any) as T;
	}

	/**
	 * Like array.sort but guarantees the order of elements with the same value stays the same
	 */
	public stableSort<T>(array: T[], cmp: Comparator<T> = defaultCmp): T[] {
		let stabilized = array.map((el, index) => <[T, number]>[el, index]);
		let stableCmp: Comparator<[T, number]> = (a, b) => {
			let order = cmp(a[0], b[0]);
			if (order != 0) return order;
			return a[1] - b[1];
		};

		stabilized.sort(stableCmp);
		for (let i = 0; i < array.length; i++) {
			array[i] = stabilized[i][0];
		}

		return array;
	}

	public mapObjectValues<T>(object: MapLike<T>, cb: (value: T, key: string) => T): MapLike<T> {
		const result: MapLike<T> = {};
		Object.keys(object).forEach((k) => (result[k] = cb(object[k], k)));
		return result;
	}

	public trimObject(object: any, options: TrimObjectOptions = { undefined: true }): any {
		for (const key in object) {
			if (options.undefined && object[key] === undefined) {
				delete object[key];
			}

			if (options.null && object[key] === null) {
				delete object[key];
			}

			if (options.NaN && Number.isNaN(object[key])) {
				delete object[key];
			}

			if (options.emptyString && object[key] === '') {
				delete object[key];
			}
		}

		return object;
	}

	public objectFromKeyArray<T>(keyArray: string[], cb: (k: string) => T): MapLike<T> {
		const result: MapLike<T> = {};

		keyArray.forEach((k) => (result[k] = cb(k)));

		return result;
	}

	public asArray<T>(valueOrArray: T | T[]): T[] {
		if (Array.isArray(valueOrArray)) {
			return valueOrArray;
		} else {
			return [valueOrArray];
		}
	}

	public for<T>(count: number, cb: (index: number) => T, startPoint: number = 0): T[] {
		const result: T[] = [];
		for (let i: number | undefined = startPoint; i < count; i++) {
			result.push(cb(i));
		}

		return result;
	}

	public async forAsync<T>(count: number, cb: (index: number) => Promise<T>, startPoint: number = 0): Promise<T[]> {
		const result: T[] = [];
		for (let i: number | undefined = startPoint; i < count; i++) {
			result.push(await cb(i));
		}

		return result;
	}

	public async flatMapAsync<T>(array: T[], cb: (item: T, index: number, array: T[]) => Promise<T[]>): Promise<T[]> {
		const result: T[] = [];

		for (let i = 0; i < array.length; i++) {
			result.push(...(await cb(array[i], i, array)));
		}

		return result;
	}

	public async mapAsync<T>(array: T[], cb: (item: T, index: number, array: T[]) => Promise<T>): Promise<T[]> {
		const result: T[] = [];

		for (let i = 0; i < array.length; i++) {
			result.push(await cb(array[i], i, array));
		}

		return result;
	}

	public async filterAsync<T>(array: T[], cb: (item: T, index: number, array: T[]) => Promise<boolean>): Promise<T[]> {
		const result: T[] = [];

		for (let i = 0; i < array.length; i++) {
			if (await cb(array[i], i, array)) {
				result.push(array[i]);
			}
		}

		return result;
	}

	public camelCaseToSnakeCase(text: string): string {
		return text.replace(/(?:^|\.?)([A-Z])/g, (x, y) => '_' + y.toLowerCase()).replace(/^_/, '');
	}

	public snakeCaseToCamelCase(value: string): string {
		return value
			.toLowerCase()
			.split('_')
			.map((part: string, index: number) => (index > 0 ? part.substring(0, 1).toUpperCase() + part.substring(1).toLowerCase() : part.toLowerCase()))
			.join('');
	}

	public pascalCaseToTitleCase(text: string): string {
		return text
			.replace(/(?:^|\.?)([A-Z])/g, (x, y) => ' ' + y)
			.replace(/^_/, '')
			.substring(1);
	}

	public camelCaseToTitleCase(text: string): string {
		return text.replace(/(?:^|\.?)([A-Z])/g, (x, y) => ' ' + y).replace(/^_/, '');
	}

	public camelCaseToKebabCase(text: string): string {
		return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
	}

	public async forEachAsync<T>(array: T[], cb: (item: T, index: number, array: T[]) => Promise<T>): Promise<void> {
		for (let i = 0; i < array.length; i++) {
			await cb(array[i], i, array);
		}
	}

	public last<T>(array: T[]): T {
		return array[array.length - 1];
	}

	public derefData<T>(data: ReadonlyData<T> | Data<T>): T {
		if (data instanceof DataSource) {
			return data.value;
		}
		if (data instanceof DuplexDataSource) {
			return data.value;
		}
		if (data instanceof Stream) {
			return data.value;
		}

		return data as T;
	}

	public toSource<T>(data: ReadonlyData<T> | Data<T>): DataSource<T> | DuplexDataSource<T> | Stream<any, T> {
		if (data instanceof DataSource) {
			return data;
		}
		if (data instanceof DuplexDataSource) {
			return data;
		}
		if (data instanceof Stream) {
			return data;
		}

		return new DataSource<T>(data as any);
	}
}

export const _ = new StreamLine();
