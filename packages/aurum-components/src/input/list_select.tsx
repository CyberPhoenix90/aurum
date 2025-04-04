import { css } from '@emotion/css';
import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    AurumElementModel,
    ClassType,
    combineClass,
    DataSource,
    dsMap,
    DuplexDataSource,
    ReadOnlyArrayDataSource,
    Renderable,
    resolveChildren,
    StyleType
} from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';
import { FormType } from '../form/form.js';

const theme = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.highlightFontColor, theme.themeColor0, theme.themeColor2, theme.primary, theme.highlightColor1],
        (fontFamily, size, highlightFont, color0, color2, primary, highlightColor1) => css`
            border-radius: 4px;
            position: relative;
            display: inline-flex;
            justify-content: space-between;
            border: 2px solid ${color2};
            box-sizing: border-box;
            border-style: inset;
            padding: 4px;
            font-family: ${fontFamily};
            font-size: ${size};
            outline: none;
            color: ${highlightFont};
            background-color: ${color0};
            width: 200px;
            user-select: none;

            ul {
                width: 100%;
                list-style-type: none;
                padding: 0;
                margin: 0;
            }

            li {
                width: 100%;
                cursor: pointer;

                &.highlight {
                    background-color: ${highlightColor1};
                    color: ${highlightFont};
                }
            }

            &:focus {
                outline: ${primary} auto 5px;
            }
        `,
        lifecycleToken
    )
);

export interface ListSelectProps<T> {
    selectedValue?: DuplexDataSource<T> | DataSource<T>;
    selectedIndex?: DuplexDataSource<number> | DataSource<number>;
    class?: ClassType;
    style?: StyleType;
    form?: FormType<any, any>;
    name?: string;

    onChange?(selectedValue: T, selectedIndex: number, previousIndex: number): void;
}

export function ListSelect<T>(props: ListSelectProps<T>, children: Renderable[], api: AurumComponentAPI) {
    const childSource: ReadOnlyArrayDataSource<AurumElementModel<{ value: T }>> =
        props.form && props.name && (props.form.schema.fields[props.name] as any).oneOf && children.length === 0
            ? new ArrayDataSource((props.form.schema.fields[props.name] as any).oneOf.map((c) => <ListSelectOption value={c}>{c}</ListSelectOption>))
            : resolveChildren(children, api.cancellationToken, (e) => (e as AurumElementModel<any>).factory === ListSelectOption);

    if (!props.selectedValue && props.form && props.name) {
        //@ts-ignore
        props.selectedValue = props.form.schema.fields[props.name].source;
    }

    const selectedIndex =
        props.selectedIndex ??
        (props.selectedValue
            ? new DataSource(
                  props.selectedValue instanceof DataSource
                      ? childSource.findIndex((c) => c.props.value === props.selectedValue.value)
                      : childSource.findIndex((c) => c.props.value === props.selectedValue.value)
              )
            : new DataSource(0));
    let childContainer: HTMLUListElement;

    if (props.selectedValue) {
        selectedIndex.listen((index) => {
            const value = childSource.get(index)?.props.value;
            if (props.selectedValue.value !== value) {
                if (props.selectedValue instanceof DataSource) {
                    props.selectedValue.update(value);
                } else {
                    props.selectedValue.updateUpstream(value);
                }
            }
        }, api.cancellationToken);
        if (props.selectedValue instanceof DataSource) {
            props.selectedValue.listen(handleValueChange<T>(childSource, selectedIndex), api.cancellationToken);
        } else {
            props.selectedValue.listenDownstream(handleValueChange<T>(childSource, selectedIndex), api.cancellationToken);
        }
    }

    childSource.listen(() => {
        if (selectedIndex instanceof DuplexDataSource) {
            selectedIndex.updateDownstream(selectedIndex.value);
        } else {
            selectedIndex.update(selectedIndex.value);
        }
    });

    return (
        <div class={combineClass(api.cancellationToken, theme, props.class)} style={props.style}>
            <ul
                tabIndex="0"
                onKeyDown={(e) => {
                    switch (e.key) {
                        case 'Escape':
                            break;
                        case 'ArrowDown':
                            if (selectedIndex.value < childSource.length.value - 1) {
                                update(selectedIndex, selectedIndex.value + 1);
                            } else {
                                update(selectedIndex, 0);
                            }
                            break;
                        case 'ArrowUp':
                            if (selectedIndex.value > 0) {
                                update(selectedIndex, selectedIndex.value - 1);
                            } else {
                                update(selectedIndex, childSource.length.value - 1);
                            }
                            break;
                        case 'Enter':
                        case ' ':
                            update(selectedIndex, selectedIndex.value);
                            break;
                        default:
                            if (e.key.length === 1) {
                                const selectedChild = childContainer.children[selectedIndex.value];
                                if (selectedChild && selectedChild.textContent[0].toLowerCase() === e.key) {
                                    for (let i = selectedIndex.value + 1; i < childContainer.children.length; i++) {
                                        if (childContainer.children[i].textContent[0].toLowerCase() === e.key) {
                                            update(selectedIndex, i);
                                            return;
                                        }
                                    }
                                }
                                let i = 0;
                                for (const c of childContainer.children) {
                                    if (c.textContent[0].toLowerCase() === e.key) {
                                        update(selectedIndex, i);
                                        break;
                                    }
                                    i++;
                                }
                            }
                    }
                }}
                onAttach={(e) => (childContainer = e)}
            >
                {childSource.map((e) => (
                    <li
                        class={selectedIndex.transform(dsMap((v) => (childSource.indexOf(e) === v ? 'highlight' : '')))}
                        onClick={() => {
                            update(selectedIndex, childSource.indexOf(e));
                        }}
                    >
                        {e.children}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function handleValueChange<T>(
    childSource: ReadOnlyArrayDataSource<AurumElementModel<{ value: T }>>,
    selectedIndex: DataSource<number> | DuplexDataSource<number>
): any {
    return (value: T) => {
        const index = childSource.findIndex((c) => c.props.value === value);
        if (selectedIndex.value !== index) {
            update(selectedIndex, index);
        }
    };
}

function update<T>(source: DataSource<T> | DuplexDataSource<T>, value: T) {
    if (source instanceof DataSource) {
        source.update(value);
    } else {
        source.updateUpstream(value);
    }
}

export function ListSelectOption<T>(props: { value: T }) {
    return undefined;
}
