import { ReadOnlyDataSource, DataSource } from '../stream/data_source.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { CancellationToken } from './cancellation_token.js';
import { AttributeValue, ClassType } from './common.js';

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

export function combineClass(cancellationToken: CancellationToken, ...args: ClassType[]): ClassType {
    args = args.filter((e) => !!e);

    if (args.length < 2) {
        return args[0];
    }

    const constants: string[] = [];
    const sources: ReadOnlyDataSource<string | string[]>[] = [];
    resolveConstants(args);

    function resolveConstants(args: ClassType[]) {
        for (const arg of args) {
            if (typeof arg === 'string') {
                constants.push(arg);
            }
            if (Array.isArray(arg)) {
                resolveConstants(arg);
            }

            if (arg instanceof DataSource || arg instanceof DuplexDataSource) {
                sources.push(arg);
            }
        }
    }

    if (sources.length) {
        return sources[0].aggregate(
            sources.slice(1),
            (...data) => {
                if (constants.length) {
                    return data.flat().concat(constants);
                } else {
                    data.flat();
                }
            },
            cancellationToken
        );
    } else {
        return constants;
    }
}

export function combineAttribute(cancellationToken: CancellationToken, ...args: AttributeValue[]): AttributeValue {
    const constants: Array<string | boolean> = [];
    const sources: ReadOnlyDataSource<string>[] = [];

    for (const attr of args) {
        if (typeof attr === 'string' || typeof attr === 'boolean') {
            constants.push(attr);
        }
        if (attr instanceof DataSource || attr instanceof DuplexDataSource) {
            sources.push(attr);
        }
    }

    if (sources.length) {
        return sources[0].aggregate(
            sources.slice(1),
            (...data) => {
                if (constants.length) {
                    return data.concat(constants).join(' ');
                } else {
                    return data.join(' ');
                }
            },
            cancellationToken
        );
    } else {
        return constants.join(' ');
    }
}
