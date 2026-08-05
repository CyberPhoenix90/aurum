import { Aurum, TextAreaProps, Renderable, ClassType, combineClass, AurumComponentAPI, css, StyleType } from 'aurumjs';
import { theme } from '../theme/theme.js';

const { fontFamily, baseFontSize: size, highlightFontColor: highlightFont, themeColor1: color1, themeColor3: color3, themeColor2: color2, primary } = theme;
const textAreaStyle = css`
            position: relative;
            display: inline-flex;
            width: 300px;

            > textarea {
                background-color: ${color1};
                font-family: ${fontFamily};
                font-size: ${size};
                outline: none;
                color: ${highlightFont};
                border-color: ${color3};
                background-color: ${color2};
                flex-grow: 1;
                width: 100%;

                &:focus {
                    border-color: ${primary};
                    border-width: 2px;
                }
            }
        `;

export interface TextAreaFieldProps extends TextAreaProps {
    decorators?: Renderable;
    style?: StyleType;
    class?: ClassType;
}

export function TextAreaField(props: TextAreaFieldProps, children: Renderable[], api: AurumComponentAPI) {
    const { decorators, style, ...inputProps } = props;

    return (
        <span
            class={combineClass(api.cancellationToken, props.class, textAreaStyle, 'text-field')}
            style={style}
        >
            <textarea {...inputProps}></textarea>
            {decorators}
        </span>
    );
}
