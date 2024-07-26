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
import { Dialog } from '../dialog/dialog.js';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';
import { FormType } from '../form/form.js';

const theme = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.highlightFontColor, theme.themeColor0, theme.themeColor2, theme.primary],
        (fontFamily, size, highlightFont, color0, color2, primary) => css`
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
            cursor: pointer;

            .invalid {
                border-color: red;
            }

            &:focus {
                outline: ${primary} auto 5px;
            }
        `,
        lifecycleToken
    )
);

const dropdownStyle = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.highlightFontColor, theme.themeColor0, theme.themeColor3, theme.themeColor4, theme.highlightColor1],
        (fontFamily, size, highlightFont, color0, color3, color4, highlightColor1) => css`
            position: relative;
            display: inline-flex;
            font-family: ${fontFamily};
            font-size: ${size};
            color: ${highlightFont};
            border: 1px solid ${color4};
            background-color: ${color0};
            width: 200px;
            user-select: none;

            ol {
                margin: 0;
                padding-left: 0;
                width: 100%;
                list-style: none;
            }

            li {
                user-select: none;
                padding-left: 4px;
                cursor: pointer;
            }

            li.highlight {
                background-color: ${highlightColor1};
            }
        `,
        lifecycleToken
    )
);

export interface DropDownMenuProps<T> {
    selectedValue?: DuplexDataSource<T> | DataSource<T>;
    selectedIndex?: DuplexDataSource<number> | DataSource<number>;
    isOpen?: DataSource<boolean>;
    class?: ClassType;
    style?: StyleType;
    form?: FormType<any, any>;
    name?: string;

    onChange?(selectedValue: T, selectedIndex: number, previousIndex: number): void;
}

export function DropDownMenu<T>(props: DropDownMenuProps<T>, children: Renderable[], api: AurumComponentAPI) {
    const childSource: ReadOnlyArrayDataSource<AurumElementModel<{ value: T }>> =
        props.form && props.name && (props.form.schema.fields[props.name] as any).oneOf && children.length === 0
            ? new ArrayDataSource((props.form.schema.fields[props.name] as any).oneOf.map((c) => <DropDownMenuOption value={c}>{c}</DropDownMenuOption>))
            : resolveChildren(children, api.cancellationToken, (e) => (e as AurumElementModel<any>).factory === DropDownMenuOption);

    if (!props.selectedValue && props.form && props.name) {
        //@ts-ignore
        props.selectedValue = props.form.schema.fields[props.name].source;
    }

    const isOpen = props.isOpen ?? new DataSource(false);
    const selectedIndex =
        props.selectedIndex ??
        (props.selectedValue
            ? new DataSource(
                  props.selectedValue instanceof DataSource
                      ? childSource.findIndex((c) => c.props.value === props.selectedValue.value)
                      : childSource.findIndex((c) => c.props.value === props.selectedValue.value)
              )
            : new DataSource(0));
    const highlightIndex = new DataSource(selectedIndex.value);

    let root: HTMLDivElement;
    let childContainer: HTMLOListElement;
    let dialog;
    const dialogSource = new DataSource();

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

    isOpen.listenAndRepeat((open) => {
        if (open) {
            dialog = (
                <Dialog
                    style={`width:${root.clientWidth}px;`}
                    class={dropdownStyle}
                    target={{
                        x: 0,
                        y: root.clientHeight
                    }}
                    layout={{
                        direction: 'down',
                        targetPoint: 'start',
                        orientationX: 'left',
                        orientationY: 'top'
                    }}
                    onClickInside={() => {
                        isOpen.update(false);
                    }}
                    onClickOutside={() => {
                        isOpen.update(false);
                    }}
                >
                    <ol onAttach={(e) => (childContainer = e)}>
                        {childSource.map((e) => (
                            <li
                                onMouseEnter={() => {
                                    highlightIndex.update(childSource.indexOf(e));
                                }}
                                class={highlightIndex.transform(dsMap((v) => (childSource.indexOf(e) === v ? 'highlight' : '')))}
                                onClick={() => {
                                    update(selectedIndex, childSource.indexOf(e));
                                }}
                            >
                                {e.children}
                            </li>
                        ))}
                    </ol>
                </Dialog>
            );

            dialogSource.update(dialog);
        } else {
            dialogSource.update(undefined);
        }
    });

    return (
        <div
            tabindex="0"
            onKeyDown={(e) => {
                switch (e.key) {
                    case 'Escape':
                        if (isOpen.value) {
                            isOpen.update(false);
                        }
                        break;
                    case 'ArrowDown':
                        if (isOpen.value) {
                            if (highlightIndex.value < childSource.length.value - 1) {
                                highlightIndex.update(highlightIndex.value + 1);
                            } else {
                                highlightIndex.update(0);
                            }
                        } else {
                            if (selectedIndex.value < childSource.length.value - 1) {
                                update(selectedIndex, selectedIndex.value + 1);
                            } else {
                                update(selectedIndex, 0);
                            }
                        }
                        break;
                    case 'ArrowUp':
                        if (isOpen.value) {
                            if (highlightIndex.value > 0) {
                                highlightIndex.update(highlightIndex.value - 1);
                            } else {
                                highlightIndex.update(childSource.length.value - 1);
                            }
                        } else {
                            if (selectedIndex.value > 0) {
                                update(selectedIndex, selectedIndex.value - 1);
                            } else {
                                update(selectedIndex, childSource.length.value - 1);
                            }
                        }
                        break;
                    case 'Enter':
                    case ' ':
                        if (isOpen.value) {
                            update(selectedIndex, highlightIndex.value);
                            isOpen.update(false);
                        } else {
                            isOpen.update(true);
                        }
                        break;
                    default:
                        if (e.key.length === 1) {
                            const selectedChild = childContainer.children[highlightIndex.value];
                            if (selectedChild && selectedChild.textContent[0].toLowerCase() === e.key) {
                                for (let i = highlightIndex.value + 1; i < childContainer.children.length; i++) {
                                    if (childContainer.children[i].textContent[0].toLowerCase() === e.key) {
                                        highlightIndex.update(i);
                                        return;
                                    }
                                }
                            }
                            let i = 0;
                            for (const c of childContainer.children) {
                                if (c.textContent[0].toLowerCase() === e.key) {
                                    highlightIndex.update(i);
                                    break;
                                }
                                i++;
                            }
                        }
                }
            }}
            onClick={() => {
                if (!isOpen.value) {
                    isOpen.update(true);
                }
            }}
            onAttach={(e) => (root = e)}
            class={combineClass(api.cancellationToken, theme, props.class)}
            style={props.style}
        >
            <div>
                {selectedIndex.transform(
                    dsMap((s) => childSource.get(s).children),
                    api.cancellationToken
                )}
            </div>
            <div>&#9660;</div>
            {dialogSource}
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

export function DropDownMenuOption<T>(props: { value: T }) {
    return undefined;
}
