import {
    Aurum,
    AurumComponentAPI,
    BindableSource,
    combineClass,
    css,
    getValueOf,
    InputProps,
    ReadOnlyDataSource,
    Renderable,
    writeTo
} from '@aurum/html';
import { theme } from '../theme/theme.js';
import { FormFieldName, FormType, getFormFieldSource } from '../form/form.js';

const { fontFamily, baseFontSize: size, highlightFontColor: highlightFont, themeColor0: color0, themeColor2: color2, primary } = theme;
const fieldStyle = css`
            position: relative;
            display: inline-flex;
            width: 200px;
            .invalid {
                border-color: red;
            }

            > input {
                border-radius: 4px;
                background-color: ${color0};
                font-family: ${fontFamily};
                font-size: ${size};
                outline: none;
                height: 24px;
                color: ${highlightFont};
                border-color: ${color2};
                flex-grow: 1;
                width: 100%;

                &:focus {
                    outline: ${primary} auto 5px;
                }
            }
        `;

export interface FormFieldInputProps<T extends object, V> extends Omit<InputProps, 'name'> {
    form?: FormType<T, unknown>;
    name?: FormFieldName<T, V> | ReadOnlyDataSource<FormFieldName<T, V>>;
    decorators?: Renderable;
}

/** Shared implementation for the public, value-specific input controls. */
export function FormFieldInput<T extends object, V>(
    props: FormFieldInputProps<T, V>,
    _children: Renderable[],
    api: AurumComponentAPI
): Renderable {
    let { decorators, style, name, form, value, ...inputProps } = props;

    if (form && name) {
        const fieldName = getValueOf(name) as FormFieldName<T, V>;
        const field = form.schema.fields[fieldName];
        if (!field) {
            throw new Error(`Field ${String(fieldName)} not found in form schema`);
        }

        if (value === undefined && inputProps.type !== 'checkbox') {
            value = getFormFieldSource<T, V>(form, fieldName) as unknown as BindableSource<string>;
        }

        if (field.required) {
            inputProps.required = true;
        }

        if ('minLength' in field && field.minLength !== undefined) {
            inputProps.minLength = field.minLength;
        }

        if ('min' in field && field.min !== undefined) {
            inputProps.min = field.min instanceof Date ? field.min.toISOString() : field.min;
        }

        if ('max' in field && field.max !== undefined) {
            inputProps.max = field.max instanceof Date ? field.max.toISOString() : field.max;
        }

        if ('maxLength' in field && field.maxLength !== undefined) {
            inputProps.maxLength = field.maxLength;
        }

        if ('match' in field && field.match !== undefined) {
            inputProps.pattern = field.match.source;
        }

        inputProps.class = combineClass(api.cancellationToken, inputProps.class, {
            invalid: form.isInvalid[fieldName]
        });

        const originalBlur = inputProps.onBlur;
        inputProps.onBlur = (event: FocusEvent) => {
            if (originalBlur) {
                writeTo(originalBlur, event);
            }
            form.validateField(fieldName);
        };
    } else if (form) {
        throw new Error('Form field without name');
    }

    return (
        <span class={combineClass(api.cancellationToken, fieldStyle, 'text-field')} style={style}>
            <input name={name} value={value} {...inputProps}></input>
            {decorators}
        </span>
    );
}
