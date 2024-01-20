import { ArrayDataSource, DataSource, MapDataSource, ReadOnlyDataSource } from '../stream/data_source.js';
import { dsMap, dsUnique } from '../stream/data_source_operators.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { CancellationToken } from '../utilities/cancellation_token.js';
import { aurumClassName, camelCaseToKebabCase } from '../utilities/classname.js';
import { ClassType, StyleType } from '../utilities/common.js';
import { Data } from '../utilities/sources.js';

export function handleClass(data: ClassType, cleanUp: CancellationToken): Data<string> {
    if (typeof data === 'string') {
        return data;
    } else if (data instanceof DataSource || data instanceof DuplexDataSource) {
        return data
            .transform(
                dsUnique(),
                dsMap((v) => {
                    if (Array.isArray(v)) {
                        return v.join(' ');
                    } else {
                        return v;
                    }
                }),
                cleanUp
            )
            .withInitial(data.value);
    } else if (data instanceof ArrayDataSource) {
        return data.reduce<string>((p, c) => `${p} ${c}`, '', cleanUp);
    } else if (data instanceof MapDataSource || (typeof data === 'object' && !Array.isArray(data))) {
        const result = aurumClassName(data as any, cleanUp);
        return handleClass(result, cleanUp);
    } else {
        const result = new DataSource<string>(buildClass(data));

        for (const i of data as Array<string | ReadOnlyDataSource<string>>) {
            if (i instanceof DataSource) {
                i.transform(dsUnique(), cleanUp).listen((v) => {
                    result.update(buildClass(data));
                }, cleanUp);
            }
        }

        return result;
    }
}

function buildClass(data: (string | ReadOnlyDataSource<string>)[]): string {
    return (data as Array<string | ReadOnlyDataSource<string>>).reduce<string>((p, c) => {
        if (c == null) {
            return p;
        }

        if (typeof c === 'string') {
            return `${p} ${c}`;
        } else {
            if (c.value) {
                return `${p} ${c.value}`;
            } else {
                return p;
            }
        }
    }, '');
}

export function handleStyle(data: StyleType, cleanUp: CancellationToken): Data<string> {
    if (typeof data === 'string') {
        return data;
    } else if (data instanceof DataSource || data instanceof DuplexDataSource) {
        return data.transform(
            dsUnique(),
            dsMap((v) => {
                return v.toString();
            }),
            cleanUp
        );
    } else if (data instanceof MapDataSource) {
        return data.toEntriesArrayDataSource(cleanUp).reduce<string>(
            (p, c) => {
                return `${p}${camelCaseToKebabCase(c[0])}:${c[1]};`;
            },
            '',
            cleanUp
        );
    } else if (typeof data === 'object' && !Array.isArray(data)) {
        const result = new ArrayDataSource<[string, string]>();
        let index = 0;
        for (const i in data) {
            if (data[i] instanceof DataSource) {
                const myIndex = index;
                result.push([i, data[i].value]);
                (data[i] as ReadOnlyDataSource<string>).listen((v) => {
                    result.set(myIndex, [i, v]);
                }, cleanUp);
            } else {
                result.push([i, data[i]]);
            }
            index++;
        }

        return result.reduce<string>((p, c) => `${p}${camelCaseToKebabCase(c[0])}:${c[1]};`, '', cleanUp);
    } else {
        return '';
    }
}
