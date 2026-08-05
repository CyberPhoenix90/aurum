import { ArrayDataSource, DataSource, MapDataSource, ReadOnlyDataSource } from '@aurum/streams';
import { dsMap, dsUnique } from '@aurum/streams';
import { CancellationToken } from '@aurum/streams';
import { aurumClassName, camelCaseToKebabCase } from '@aurum/streams';
import { ClassType, StyleType, Styles } from '@aurum/streams';
import { Data } from '@aurum/streams';
import { isAurumStyleClass } from '@aurum/streams';

export function handleClass(data: ClassType, cleanUp: CancellationToken): Data<string> {
    if (typeof data === 'string') {
        return data;
    } else if (isAurumStyleClass(data)) {
        return data.attach(cleanUp);
    } else if (data instanceof DataSource) {
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
        const result = new DataSource<string>(buildClass(data, cleanUp));

        for (const i of data as Array<string | ReadOnlyDataSource<string>>) {
            if (i instanceof DataSource) {
                i.transform(dsUnique(), cleanUp).listen((v) => {
                    result.update(buildClass(data, cleanUp));
                }, cleanUp);
            }
        }

        return result;
    }
}

function buildClass(data: Array<string | import('@aurum/streams').AurumStyleClass | ReadOnlyDataSource<string>>, cleanUp: CancellationToken): string {
    return data.reduce<string>((p, c) => {
        if (c == null) {
            return p;
        }

        if (typeof c === 'string') {
            return `${p} ${c}`;
        } else if (isAurumStyleClass(c)) {
            return `${p} ${c.attach(cleanUp)}`;
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
    } else if (data instanceof DataSource) {
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
                return `${p}${camelCaseToKebabCase(c[0] as string)}:${transformStyle(c[0] as string, c[1])};`;
            },
            '',
            cleanUp
        );
    } else if (typeof data === 'object' && !Array.isArray(data)) {
        const result = new ArrayDataSource<[string, string]>();
        const styles = data as Styles;
        let index = 0;
        for (const i in styles) {
            const value = styles[i as keyof Styles];
            if (value instanceof DataSource) {
                const myIndex = index;
                result.push([i, value.value.toString()]);
                (value as ReadOnlyDataSource<string | number>).listen((v) => {
                    result.set(myIndex, [i, v.toString()]);
                }, cleanUp);
            } else if (value !== undefined) {
                result.push([i, value.toString()]);
            }
            index++;
        }

        return result.reduce<string>((p, c) => `${p}${camelCaseToKebabCase(c[0])}:${transformStyle(c[0], c[1])};`, '', cleanUp);
    } else {
        return '';
    }
}

const stylesWithUnits = new Set([
    'width',
    'height',
    'top',
    'right',
    'bottom',
    'left',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'padding',
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'paddingBottom',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'fontSize',
    'gap',
    'gridRowGap',
    'gridColumnGap',
    'borderRadius',
    'borderWidth'
]);

function transformStyle(key: string, value: any): string {
    if (typeof value === 'number' && value !== 0 && stylesWithUnits.has(key)) {
        return value + 'px';
    }

    return value.toString();
}
