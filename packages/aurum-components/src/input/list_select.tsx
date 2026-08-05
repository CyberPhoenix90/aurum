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
    ReadOnlyDataSource,
    Renderable,
    resolveChildren,
    StyleType,
    css
} from '@aurum/html';
import { theme } from '../theme/theme.js';
import { FormFieldName, FormType, getFormFieldSource } from '../form/form.js';

const { fontFamily, baseFontSize: size, highlightFontColor: highlightFont, themeColor0: color0, themeColor2: color2, primary, highlightColor1 } = theme;
const listStyle = css`
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
        `;

export interface ListSelectProps<T, F extends object = Record<string, T>> {
    selectedValue?: BindableSource<T>;
    selectedIndex?: MutableSource<number>;
    class?: ClassType;
    style?: StyleType;
    form?: FormType<F, unknown>;
    name?: FormFieldName<F, T>;

    onChange?(selectedValue: T, selectedIndex: number, previousIndex: number): void;
}

export function ListSelect<T, F extends object = Record<string, T>>(props: ListSelectProps<T, F>, children: Renderable[], api: AurumComponentAPI) {
    const formField = props.form && props.name ? props.form.schema.fields[props.name] : undefined;
    const formOptions = formField && 'oneOf' in formField ? (formField.oneOf as readonly T[] | undefined) : undefined;
    const childSource: ReadOnlyArrayDataSource<AurumElementModel<{ value: T }>> =
        formOptions && children.length === 0
            ? new ArrayDataSource(formOptions.map((c) => <ListSelectOption value={c}>{c}</ListSelectOption>))
            : resolveChildren(children, api.cancellationToken, (e) => (e as AurumElementModel<{ value: T }>).factory === ListSelectOption);

    if (!props.selectedValue && formField) {
        props.selectedValue = getFormFieldSource<F, T>(props.form, props.name);
    }

    const selectedIndex: MutableSource<number> =
        props.selectedIndex ??
        (props.selectedValue
            ? new DataSource(
                  childSource.findIndex((c) => c.props.value === props.selectedValue.value)
              )
            : new DataSource(0));
    let childContainer: HTMLUListElement;

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

    return (
        <div class={combineClass(api.cancellationToken, listStyle, props.class)} style={props.style}>
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
                        class={
                            selectedIndex.transform(dsMap<number, string>((v) => (childSource.indexOf(e) === v ? 'highlight' : ''))) as ReadOnlyDataSource<string>
                        }
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

export function ListSelectOption<T>(props: { value: T }): undefined {
    return undefined;
}
