import { ReadOnlyDataSource, DataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
import { CancellationToken } from './cancellation_token';

export function aurumClassName(
	data: { [key: string]: boolean | ReadOnlyDataSource<boolean> },
	cancellationToken?: CancellationToken
): Array<string | ReadOnlyDataSource<string>> {
	const result = [];
	for (const key in data) {
		if (data[key]) {
			if (data[key] instanceof DataSource || data[key] instanceof DuplexDataSource) {
				const source = data[key] as ReadOnlyDataSource<boolean>;
				const mappedSource = new DataSource<string>(source.value ? key : '');
				source.listen((value) => {
					mappedSource.update(value ? key : '');
				}, cancellationToken);

				result.push(mappedSource);
			} else {
				result.push(key);
			}
		}
	}
	return result;
}
