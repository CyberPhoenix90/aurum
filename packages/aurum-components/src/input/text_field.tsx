import { css } from '@emotion/css';
import { Aurum, DataSource, dsMap, Renderable, InputProps } from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';

const theme = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.highlightFontColor, theme.themeColor0, theme.themeColor1, theme.themeColor3, theme.themeColor2],
        (fontFamily, size, highlightFont, color0, color1, color3, color2) => css`
            position: relative;
            display: inline-flex;
            width: 200px;

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
            }
        `,
        lifecycleToken
    )
);

export interface TextFieldProps extends InputProps {
    decorators?: Renderable;
}

export function TextField(props: TextFieldProps): Renderable {
    const { decorators, style, ...inputProps } = props;

    return (
        <span class={theme.transform(dsMap<string, string>((t) => `${t} text-field`)) as DataSource<string>} style={style}>
            <input {...inputProps}></input>
            {decorators}
        </span>
    );
}
