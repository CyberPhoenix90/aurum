import { css } from '@emotion/css';
import { Aurum, Renderable } from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';
import { Dialog } from './dialog.js';

export interface ContextMenuProps {}

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.baseFontColor, theme.themeColor1, theme.highlightColor1],
        (fontFamily, size, fontColor, color1, highlight1) => css`
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};
            background-color: ${color1};
            user-select: none;
            padding: 4px 0;
            box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);

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

export function spawnContextMenu(
    items: Renderable[],
    e: {
        target: EventTarget;
        offsetX: number;
        offsetY: number;
    },
    config: {
        unstyled?: boolean;
        onClose?: () => void;
        orientationX?: 'left' | 'right';
        orientationY?: 'top' | 'bottom';
        allowClickInside?: boolean;
    }
): Renderable {
    const { onClose, orientationX = 'left', orientationY = 'top', unstyled = false, allowClickInside = false } = config;
    return (
        <Dialog
            onClickOutside={() => {
                onClose?.();
            }}
            onClickInside={() => {
                if (!allowClickInside) {
                    onClose?.();
                }
            }}
            onEscape={() => {
                onClose?.();
            }}
            blockNativeContextMenu
            target={e.target as HTMLElement}
            layout={{
                offset: { x: e.offsetX, y: e.offsetY },
                direction: 'up',
                targetPoint: 'start',
                orientationX,
                orientationY
            }}
        >
            {unstyled ? <>{items}</> : <ContextMenu>{items}</ContextMenu>}
        </Dialog>
    );
}
