import { css } from '@emotion/css';
import { Aurum, Renderable } from 'aurumjs';
import { ButtonProps } from 'aurumjs/prebuilt/cjs/nodes/simple_dom_nodes';
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';

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
        `,
        lifecycleToken
    )
);

export function Button(props: ButtonProps, children: Renderable[]) {
    return (
        <button class={style} {...props}>
            {children}
        </button>
    );
}
