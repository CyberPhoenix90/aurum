import { css } from '@emotion/css';
import { Aurum, Renderable } from 'aurumjs';
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';

export interface ContextMenuProps {}

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.baseFontColor, theme.themeColor2, theme.highlightColor1],
        (fontFamily, size, fontColor, color2, highlight1) => css`
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};
            background-color: ${color2};
            user-select: none;
            padding: 4px 0;
            box-shadow: 0px 0px 4px 1px black;

            ul {
                margin-block-start: 0em;
                list-style: none;
                margin-block-end: 0em;
                padding-inline-start: 0px;
                min-width: 100px;
            }

            li {
                &:hover {
                    background-color: ${highlight1};
                }
            }

            li > * {
                padding: 5px 5px 5px 15px;
                cursor: pointer;
            }
        `,
        lifecycleToken
    )
);

export function ContextMenu(props: ContextMenuProps, children: Renderable[]) {
    return (
        <div class={style}>
            <ul>
                {children.flat().map((e) => (
                    <li>{e}</li>
                ))}
            </ul>
        </div>
    );
}
