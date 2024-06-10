import { css } from '@emotion/css';
import { Aurum, DataSource, dsMap, Renderable, InputProps, getValueOf, combineClass, AurumComponentAPI } from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';
import { FormType } from './form.js';

const theme = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [
            theme.fontFamily,
            theme.baseFontSize,
            theme.highlightFontColor,
            theme.themeColor0,
            theme.themeColor1,
            theme.themeColor3,
            theme.themeColor2,
            theme.primary
        ],
        (fontFamily, size, highlightFont, color0, color1, color3, color2, primary) => css`
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
        `,
        lifecycleToken
    )
);

export interface TextFieldProps extends InputProps {
    form?: FormType<any, any>;
    decorators?: Renderable;
}

export function TextField(props: TextFieldProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    let { decorators, style, name, form, value, ...inputProps } = props;

    if (form && name) {
        if (!form.schema[getValueOf(name)]) {
            throw new Error(`Field ${name} not found in form schema`);
        }

        if (!value) {
            value = form.schema[getValueOf(name)].source as DataSource<any>;
        }

        if (form.schema[getValueOf(name)].required) {
            inputProps.required = true;
        }

        //@ts-ignore
        if (form.schema[getValueOf(name)].minLength) {
            //@ts-ignore
            inputProps.minLength = form.schema[getValueOf(name)].minLength;
        }

        //@ts-ignore
        if (form.schema[getValueOf(name)].min) {
            //@ts-ignore
            inputProps.min = form.schema[getValueOf(name)].min;
        }

        //@ts-ignore
        if (form.schema[getValueOf(name)].max) {
            //@ts-ignore
            inputProps.max = form.schema[getValueOf(name)].max;
        }

        //@ts-ignore
        if (form.schema[getValueOf(name)].maxLength) {
            //@ts-ignore
            inputProps.maxLength = form.schema[getValueOf(name)].maxLength;
        }

        //@ts-ignore
        if (form.schema[getValueOf(name)].match) {
            //@ts-ignore
            inputProps.pattern = form.schema[getValueOf(name)].match.source;
        }

        inputProps.class = combineClass(api.cancellationToken, inputProps.class, {
            invalid: form.isInvalid[getValueOf(name)]
        });

        let originalBlur;
        if (inputProps.onBlur) {
            originalBlur = inputProps.onBlur;
        }

        inputProps.onBlur = (e: FocusEvent) => {
            if (originalBlur) {
                originalBlur(e);
            }
            form.validateField(getValueOf(name));
        };
    } else if (form && !name) {
        throw new Error('Form field without name');
    }

    return (
        <span class={theme.transform(dsMap<string, string>((t) => `${t} text-field`)) as DataSource<string>} style={style}>
            <input value={value} {...inputProps}></input>
            {decorators}
        </span>
    );
}
