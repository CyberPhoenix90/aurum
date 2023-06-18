import { css } from '@emotion/css';
import { Aurum, TextAreaProps, DataSource, dsMap, Renderable, ClassType, combineClass, AurumComponentAPI, StyleType } from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';

const theme = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.highlightFontColor, theme.themeColor1, theme.themeColor3, theme.themeColor2],
        (fontFamily, size, highlightFont, color1, color3, color2) => css`
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
            }
        `,
        lifecycleToken
    )
);

export interface TextAreaFieldProps extends TextAreaProps {
    decorators?: Renderable;
    style?: StyleType;
    class?: ClassType;
}

export function TextAreaField(props: TextAreaFieldProps, children: Renderable[], api: AurumComponentAPI) {
    const { decorators, style, ...inputProps } = props;

    return (
        <span
            class={combineClass(api.cancellationToken, props.class, theme.transform(dsMap<string, string>((t) => `${t} text-field`)) as DataSource<string>)}
            style={style}
        >
            <textarea {...inputProps}></textarea>
            {decorators}
        </span>
    );
}
