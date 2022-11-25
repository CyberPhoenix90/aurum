import { css } from '@emotion/css';
import { aurumify, currentTheme } from 'aurum-components';
import { Aurum } from 'aurumjs';
import { AbstractEditorProps } from '../abstract.js';

export interface NoneEditorProps extends AbstractEditorProps {}

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.heading3FontSize, theme.baseFontColor, theme.themeColor2],
        (fontFamily, size, fontColor, color2) => css`
            width: 100%;
            height: 100%;
            background-color: ${color2};
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};
            user-select: none;

            display: flex;
            justify-content: center;
            align-items: center;
        `,
        lifecycleToken
    )
);

export function NoneEditor(props: NoneEditorProps) {
    return <div class={style}>No file open</div>;
}
