import { css } from '@emotion/css';
import { ButtonProps, Aurum, Renderable, combineClass, AurumComponentAPI } from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.highContrastFontColor, theme.themeColor1, theme.themeColor3, theme.themeColor2],
        (fontFamily, size, highContrastFontColor, color1, color3, color2) => css`
            background-color: ${color1};
            font-family: ${fontFamily};
            font-size: ${size};
            outline: none;
            padding: 4px;
            user-select: none;
            color: ${highContrastFontColor};
            border-color: ${color3};
            background-color: ${color2};
            display: flex;
            align-items: center;

            cursor: pointer;
        `,
        lifecycleToken
    )
);

export function Button(props: ButtonProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    return (
        <button class={combineClass(api.cancellationToken, props.class, style)} {...props}>
            {children}
        </button>
    );
}
