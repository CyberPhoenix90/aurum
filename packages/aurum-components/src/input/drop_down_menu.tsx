import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    AurumElementModel,
    BindableSource,
    ClassType,
    combineClass,
    DataSource,
    dsMap,
    MutableSource,
    ReadOnlyArrayDataSource,
    Renderable,
    resolveChildren,
    StyleType,
    css
} from '@aurum/html';
import { Dialog } from '../dialog/dialog.js';
import { theme } from '../theme/theme.js';
import { FormFieldName, FormType, getFormFieldSource } from '../form/form.js';

const { fontFamily, baseFontSize: size, highlightFontColor: highlightFont, themeColor0: color0, themeColor2: color2, primary } = theme;
const menuStyle = css`
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
        `;

const { themeColor4: color4, highlightColor1 } = theme;
const dropdownStyle = css`
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
        `;

export interface DropDownMenuProps<T, F extends object = Record<string, T>> {
    selectedValue?: BindableSource<T>;
    selectedIndex?: MutableSource<number>;
    isOpen?: BindableSource<boolean>;
    class?: ClassType;
    style?: StyleType;
    form?: FormType<F, unknown>;
    name?: FormFieldName<F, T>;

    onChange?(selectedValue: T, selectedIndex: number, previousIndex: number): void;
}

export function DropDownMenu<T, F extends object = Record<string, T>>(props: DropDownMenuProps<T, F>, children: Renderable[], api: AurumComponentAPI) {
    const formField = props.form && props.name ? props.form.schema.fields[props.name] : undefined;
    const formOptions = formField && 'oneOf' in formField ? (formField.oneOf as readonly T[] | undefined) : undefined;
    const childSource: ReadOnlyArrayDataSource<AurumElementModel<{ value: T }>> =
        formOptions && children.length === 0
            ? new ArrayDataSource(formOptions.map((c) => <DropDownMenuOption value={c}>{c}</DropDownMenuOption>))
            : resolveChildren(children, api.cancellationToken, (e) => (e as AurumElementModel<{ value: T }>).factory === DropDownMenuOption);

    if (!props.selectedValue && formField) {
        props.selectedValue = getFormFieldSource<F, T>(props.form, props.name);
    }

    const isOpen = props.isOpen ?? new DataSource(false);
    const selectedIndex: MutableSource<number> =
        props.selectedIndex ??
        (props.selectedValue
            ? new DataSource(
                  childSource.findIndex((c) => c.props.value === props.selectedValue.value)
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
                props.selectedValue.write(value);
            }
        }, api.cancellationToken);
        props.selectedValue.listen(handleValueChange<T>(childSource, selectedIndex), api.cancellationToken);
    }

    childSource.listen(() => {
        selectedIndex.publish(selectedIndex.value);
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
                        isOpen.write(false);
                    }}
                    onClickOutside={() => {
                        isOpen.write(false);
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
            tabIndex={0}
            onKeyDown={(e) => {
                switch (e.key) {
                    case 'Escape':
                        if (isOpen.value) {
                            isOpen.write(false);
                        }
                        break;
                    case 'ArrowDown':
                        if (highlightIndex.value < childSource.length.value - 1) {
                            highlightIndex.update(highlightIndex.value + 1);
                        } else {
                            highlightIndex.update(0);
                        }
                        break;
                    case 'ArrowUp':
                        if (highlightIndex.value > 0) {
                            highlightIndex.update(highlightIndex.value - 1);
                        } else {
                            highlightIndex.update(childSource.length.value - 1);
                        }
                        break;
                    case 'Enter':
                    case ' ':
                        if (isOpen.value) {
                            update(selectedIndex, highlightIndex.value);
                            isOpen.write(false);
                        } else {
                            isOpen.write(true);
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
                    isOpen.write(true);
                }
            }}
            onAttach={(e) => (root = e)}
            class={combineClass(api.cancellationToken, menuStyle, props.class)}
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
    selectedIndex: BindableSource<number>
): (value: T) => void {
    return (value: T) => {
        const index = childSource.findIndex((c) => c.props.value === value);
        if (selectedIndex.value !== index) {
            update(selectedIndex, index);
        }
    };
}

function update<T>(source: BindableSource<T>, value: T) {
    source.write(value);
}

export function DropDownMenuOption<T>(props: { value: T }): undefined {
    return undefined;
}
