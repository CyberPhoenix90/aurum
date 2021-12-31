import { css } from '@emotion/css';
import { Aurum, DataSource, dsMap, Renderable } from 'aurumjs';
import { TextAreaProps } from 'aurumjs/prebuilt/cjs/nodes/textarea';
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';

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
}

export function TextAreaField(props: TextAreaFieldProps) {
    const { decorators, style, ...inputProps } = props;

    return (
        <span class={theme.transform(dsMap<string, string>((t) => `${t} text-field`)) as DataSource<string>} style={style}>
            <textarea {...inputProps}></textarea>
            {decorators}
        </span>
    );
}
