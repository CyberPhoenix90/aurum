import { ReadOnlyDataSource, DataSource, MapDataSource, ArrayDataSource } from '../stream/data_source.js';
import { dsMap } from '../stream/data_source_operators.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { CancellationToken } from './cancellation_token.js';
import { AttributeValue, ClassType, StyleType, Styles } from './common.js';

export function aurumClassName(
    data: { [key: string]: boolean | ReadOnlyDataSource<boolean> } | MapDataSource<string, boolean>,
    cancellationToken?: CancellationToken
): Array<string | ReadOnlyDataSource<string>> | ArrayDataSource<string> {
    if (data instanceof MapDataSource) {
        return handleClassMapDataSource(data, cancellationToken);
    } else {
        return handleClassMapLike(data, cancellationToken);
    }
}

function handleClassMapLike(
    data: { [key: string]: boolean | ReadOnlyDataSource<boolean> } | MapDataSource<string, boolean>,
    cancellationToken: CancellationToken
) {
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

function handleClassMapDataSource(data: MapDataSource<string, boolean>, cancellationToken: CancellationToken): ArrayDataSource<string> {
    const stateMap: Map<string, boolean> = new Map<string, boolean>();
    const result = new ArrayDataSource<string>();
    data.listenAndRepeat((change) => {
        if (change.deleted && stateMap.has(change.key)) {
            result.remove(change.key);
            stateMap.delete(change.key);
        } else if (stateMap.has(change.key)) {
            const newState = change.newValue;
            if (newState && !stateMap.get(change.key)) {
                result.push(change.key);
            }
            if (!newState && stateMap.get(change.key)) {
                result.remove(change.key);
            }
            stateMap.set(change.key, newState);
        } else if (!stateMap.has(change.key) && !change.deleted) {
            const newState = change.newValue;
            if (newState) {
                result.push(change.key);
            }
            stateMap.set(change.key, newState);
        }
    }, cancellationToken);

    return result;
}

export function combineClass(cancellationToken: CancellationToken, ...args: ClassType[]): ClassType {
    args = args.filter((e) => !!e);

    if (args.length < 2) {
        return args[0];
    }

    let fixed: string = '';
    const sources: ReadOnlyDataSource<string | string[]>[] = [];
    const maps: MapDataSource<string, boolean>[] = [];

    resolveConstants(args);

    function resolveConstants(args: ClassType[]) {
        for (const arg of args) {
            if (typeof arg === 'string') {
                fixed += arg + ' ';
            } else if (Array.isArray(arg)) {
                resolveConstants(arg);
            } else if (arg instanceof DataSource || arg instanceof DuplexDataSource) {
                sources.push(arg);
            } else if (arg instanceof MapDataSource) {
                maps.push(arg);
            } else if (typeof arg === 'object') {
                for (const key in arg) {
                    if (arg[key] instanceof DataSource || arg[key] instanceof DuplexDataSource) {
                        sources.push(
                            arg[key].transform(
                                dsMap((v) => (v ? key : '')),
                                cancellationToken
                            )
                        );
                    } else {
                        fixed += arg[key] ? key + ' ' : '';
                    }
                }
            }
        }
    }

    fixed = fixed.trim();

    if (sources.length || maps.length) {
        const result = new DataSource<string>();

        function update() {
            const classes: string[] = [fixed];
            for (const source of sources) {
                if (Array.isArray(source.value)) {
                    classes.push(...source.value);
                } else {
                    classes.push(source.value);
                }
            }
            for (const map of maps) {
                for (const key of map.keys()) {
                    if (map.get(key)) {
                        classes.push(key);
                    }
                }
            }
            result.update(classes.join(' '));
        }

        update();

        for (const source of sources) {
            source.listen(update, cancellationToken);
        }

        for (const map of maps) {
            map.listen(update, cancellationToken);
        }

        return result;
    } else {
        return fixed;
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
                    if (data.length === 1) {
                        return data[0];
                    } else {
                        return data.join(' ');
                    }
                }
            },
            cancellationToken
        );
    } else {
        return constants.join(' ');
    }
}

export function combineStyle(cancellationToken: CancellationToken, ...args: StyleType[]): StyleType {
    let fixed: string = '';
    const sources: ReadOnlyDataSource<string>[] = [];
    const maps: MapDataSource<keyof Styles, string | number>[] = [];

    for (const attr of args) {
        if (typeof attr === 'string') {
            fixed += attr + ';';
        } else if (attr instanceof DataSource || attr instanceof DuplexDataSource) {
            sources.push(attr);
        } else if (attr instanceof MapDataSource) {
            maps.push(attr);
        } else if (typeof attr === 'object' && !(attr instanceof DataSource || attr instanceof DuplexDataSource)) {
            //@ts-ignore
            for (const key in attr) {
                if (attr[key] instanceof DataSource) {
                    sources.push(attr[key].transform((v) => `${camelCaseToKebabCase(key)}:${v};`, cancellationToken));
                } else {
                    fixed += `${camelCaseToKebabCase(key)}:${attr[key]};`;
                }
            }
        }
    }

    if (sources.length || maps.length) {
        let result = new DataSource(computeResult(fixed, sources, maps));

        for (const source of sources) {
            source.listenAndRepeat((change) => {
                result.update(computeResult(fixed, sources, maps));
            }, cancellationToken);
        }

        for (const map of maps) {
            map.listenAndRepeat((change) => {
                result.update(computeResult(fixed, sources, maps));
            }, cancellationToken);
        }

        return result;
    } else {
        return fixed;
    }
}

function computeResult(fixed: string, sources: ReadOnlyDataSource<string>[], maps: MapDataSource<keyof Styles, string | number>[]) {
    let result = fixed;
    for (const source of sources) {
        result += source.value;
    }

    for (const map of maps) {
        for (const key of map.keys()) {
            if (map.get(key)) {
                result += `${camelCaseToKebabCase(key as string)}:${map.get(key)};`;
            }
        }
    }
    return result;
}

export function camelCaseToKebabCase(key: string): string {
    return key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}
