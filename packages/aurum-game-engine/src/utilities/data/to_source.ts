import { DataSource } from 'aurumjs';
import { Data } from '../../models/input_data';

export function toSource<T>(value: Data<T>, defaultValue?: T): DataSource<T> {
	if (value === undefined) {
		return new DataSource(defaultValue);
	} else if (value instanceof DataSource) {
		if (value.value === undefined) {
			value.update(defaultValue);
		}
		return value;
	} else {
		return new DataSource(value as T);
	}
}

export function toSourceIfDefined<T>(value: Data<T>): DataSource<T> {
	if (value === undefined) {
		return undefined;
	} else if (value instanceof DataSource) {
		return value;
	} else {
		return new DataSource(value as T);
	}
}
