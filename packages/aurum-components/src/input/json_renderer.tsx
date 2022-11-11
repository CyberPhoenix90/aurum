import { Aurum, AurumComponentAPI, DataSource, dsMap, dsUnique, DuplexDataSource, getValueOf, Renderable } from 'aurumjs';
import { css } from '@emotion/css';
import { aurumify } from '../utils';
import { currentTheme } from '../theme/theme';
import { Button } from './button';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.baseFontColor, theme.disabledFontColor, theme.themeColor1, theme.themeColor2, theme.highlightColor1],
        (fontFamily, size, fontColor, disabledFontColor, color1, color2, highlightColor) => css`
            background-color: ${color1};
            font-family: ${fontFamily};
            font-size: ${size};
            color: ${fontColor};
            background-color: ${color2};
            padding-left: 10px;
            padding-right: 10px;

            .special-value {
                color: ${disabledFontColor};
            }

            .hint {
                color: ${disabledFontColor};
                margin-left: 15px;
                font-style: italic;
            }

            .expandable {
                > span {
                    cursor: pointer;
                }
            }

            .highlighted {
                font-weight: bold;
                cursor: pointer;
                color: ${highlightColor};
                user-select: none;
            }

            .clickable {
                cursor: pointer;
            }
        `,
        lifecycleToken
    )
);

export interface JSONRendererProps {
    datePreview?: {
        isDate(key: string): boolean;
        formatDate?(value: number | string): string;
    };
    allowEdit?: {
        isEditable?(key: string, value: any): boolean;
        validateNewValue?(key: string, newValue: any, oldValue: any): boolean;
        inputComponent(key: string, value: any, callbacks: { onEditDone: (newValue: any) => void; onEditCancelled: () => void }): Renderable;
    };
    previewFields?: string[];
    stringsStyle?: string;
    numbersStyle?: string;
    maxStringSize?: number;
    maxArrayIndexesPerLoadMore?: number;
    preExpanded?: boolean;
}
export function JSONRenderer(props: JSONRendererProps, children: any[], api: AurumComponentAPI): Renderable {
    if (children.length !== 1) {
        throw new Error('JSON renderer only supports exactly one child');
    }

    if (children[0] instanceof DataSource || children[0] instanceof DuplexDataSource) {
        return children[0].transform(
            dsMap((c) => {
                if (c == null) {
                    return <></>;
                }

                return (
                    <JSONRendererBranch {...props} id="" editing={new DataSource(undefined)}>
                        {c}
                    </JSONRendererBranch>
                );
            }),
            api.cancellationToken
        );
    } else {
        return (
            <JSONRendererBranch {...props} id="" editing={new DataSource(undefined)}>
                {children[0]}
            </JSONRendererBranch>
        );
    }
}
interface JSONRendererBranchProps extends JSONRendererProps {
    id: string;
    editing: DataSource<string>;
}

export function JSONRendererBranch(props: JSONRendererBranchProps, children: any[]): Renderable {
    const keys = Object.keys(children[0]);
    const maxIndex = new DataSource(props.maxArrayIndexesPerLoadMore ?? 100);

    return maxIndex.transform(
        dsMap(() => (
            <ul class={style} style="list-style:none;">
                {keys.map((key, i) => {
                    if (i < maxIndex.value) {
                        return renderKey(key, children[0], props, props.id + '|' + key);
                    } else if (maxIndex.value === i) {
                        return (
                            <div class="highlighted" onClick={() => maxIndex.update(maxIndex.value + (props.maxArrayIndexesPerLoadMore ?? 100))}>
                                Showing {maxIndex.value}/{keys.length} entries [load more]
                            </div>
                        );
                    } else {
                        return undefined;
                    }
                })}
            </ul>
        ))
    );
}

function renderKey(key: string, obj: any, props: JSONRendererBranchProps, id: string): Renderable {
    let value = getValueOf(obj[key]);
    let rawValue = obj[key];

    const handleReadValueClick = () => {
        props.editing.update(id);
    };

    return props.editing.withInitial(undefined).transform(
        dsMap((editTarget) => editTarget === id),
        dsUnique(),
        dsMap((isEditing) => {
            if (isEditing) {
                return (
                    <li style="display:flex;">
                        {key}:
                        {props.allowEdit.inputComponent(key, value, {
                            onEditDone: (newValue) => {
                                if (!props.allowEdit.validateNewValue || props.allowEdit.validateNewValue(key, newValue, value)) {
                                    if (rawValue instanceof DataSource) {
                                        value = newValue;
                                        rawValue.update(newValue);
                                    } else if (rawValue instanceof DuplexDataSource) {
                                        value = newValue;
                                        rawValue.updateUpstream(newValue);
                                    } else {
                                        value = newValue;
                                        rawValue = newValue;
                                        obj[key] = newValue;
                                    }
                                }
                                props.editing.update(undefined);
                            },
                            onEditCancelled: () => {
                                props.editing.update(undefined);
                            }
                        })}
                    </li>
                );
            }
            if (props.allowEdit && (props.allowEdit.isEditable?.(key, value) ?? true)) {
                return (
                    <div
                        style="display: flex; justify-content: space-between;"
                        class="clickable"
                        onClick={handleReadValueClick}
                        onFocus={handleReadValueClick}
                        tabindex="0"
                    >
                        {renderValue(key, obj, props, id)}
                    </div>
                );
            } else {
                return renderValue(key, obj, props, id);
            }
        })
    );
}

function renderValue(key: string, obj: any, props: JSONRendererBranchProps, id: string): Renderable {
    const value = getValueOf(obj[key]);

    if (value === undefined) {
        return (
            <li>
                {key}: <span class="special-value">undefined</span>
            </li>
        );
    } else if (value === null) {
        return (
            <li>
                {key}: <span class="special-value">null</span>
            </li>
        );
    }

    if (typeof value === 'object') {
        return renderObject(key, obj, props, id);
    } else {
        const expanded = new DataSource<boolean>(!value || value.toString().length < (props.maxStringSize ?? 500));
        return (
            <li>
                {key}:{' '}
                {expanded.transform(
                    dsMap((isExpanded) => {
                        if (isExpanded) {
                            if (props.datePreview?.isDate(key)) {
                                return (
                                    <span class="number">
                                        {value}{' '}
                                        <span class="hint">
                                            {props.datePreview?.formatDate?.(value) ??
                                                new Date(obj[key]).toLocaleDateString(undefined, {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    minute: 'numeric',
                                                    second: 'numeric',
                                                    timeZoneName: 'short'
                                                })}
                                        </span>
                                    </span>
                                );
                            } else {
                                if (typeof value === 'number') {
                                    return <span style="number">{value}</span>;
                                } else if (typeof value === 'string') {
                                    return <span class="string">"{value}"</span>;
                                } else {
                                    return value?.toString() ?? '';
                                }
                            }
                        } else {
                            return (
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        expanded.update(true);
                                    }}
                                >
                                    {value.toString().substring(0, 600)}
                                    <Button onClick={() => expanded.update(true)}>...</Button>
                                </span>
                            );
                        }
                    })
                )}
            </li>
        );
    }
}

function isEmptyObject(data: any): boolean {
    return typeof data === 'object' && !!data && Object.keys(data).length === 0;
}

function isEmptyArray(data: any): boolean {
    return typeof data === 'object' && !!data && Array.isArray(data) && data.length === 0;
}

function isOneElementArray(data: any): boolean {
    return typeof data === 'object' && !!data && Array.isArray(data) && data.length === 1;
}

function renderObject(key: string, obj: any, props: JSONRendererBranchProps, id: string): any {
    if (obj[key] === undefined) {
        return <li>{key}: undefined</li>;
    } else if (obj[key] === null) {
        return <li>{key}: null</li>;
    } else {
        const expanded = new DataSource<boolean>(props.preExpanded || isEmptyObject(obj[key]) || isEmptyArray(obj[key]) || isOneElementArray(obj));
        return (
            <li class="expandable">
                <span onClick={() => !isEmptyArray(obj[key]) && !isEmptyObject(obj[key]) && expanded.update(!expanded.value)}>{key}: </span>
                {expanded.transform(
                    dsMap((value) => {
                        if (value) {
                            return isEmptyArray(obj[key]) ? (
                                '[]'
                            ) : isEmptyObject(obj[key]) ? (
                                '{}'
                            ) : (
                                <>
                                    <Button onClick={() => expanded.update(false)}>-</Button>
                                    <JSONRendererBranch id={id} {...props}>
                                        {obj[key]}
                                    </JSONRendererBranch>
                                </>
                            );
                        } else {
                            return (
                                <>
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            expanded.update(true);
                                        }}
                                    >
                                        <Button onClick={() => expanded.update(true)}>+</Button>
                                        {renderPreview(obj[key], props)}
                                    </span>
                                </>
                            );
                        }
                    })
                )}
            </li>
        );
    }
}

function renderPreview(value: any, props: JSONRendererProps): Renderable {
    if (!props.previewFields || !value || typeof value !== 'object') {
        return undefined;
    }

    const keys = Object.keys(value);
    for (const key of keys) {
        if (props.previewFields.includes(key) && ['number', 'string'].includes(typeof value[key])) {
            return <span class="hint">{value[key]}</span>;
        }
    }

    return undefined;
}
