import { css } from '@emotion/css';
import { Aurum, AurumComponentAPI, AurumElementModel, DataSource, dsMap, getValueOf, Renderable } from 'aurumjs';
import { Button } from '../input/button';
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.baseFontColor, theme.themeColor1, theme.themeColor2, theme.themeColor4],
        (fontFamily, size, fontColor, color1, color2, color4) => css`
            display: flex;
            flex-direction: column;
            position: fixed;
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};
            box-shadow: 0px 0px 8px 1px black;
            .floating-title {
                font-size: 120%;
                display: flex;
                padding: 4px;
                user-select: none;
                justify-content: space-between;
                background-color: ${color1};
                min-height: 20px;

                .window-actions {
                    & > * {
                        margin-left: 4px;
                    }
                    display: flex;
                }
            }

            .floating-body {
                display: flex;
                height: 100%;
                border-left: 1px solid ${color4};
                border-right: 1px solid ${color4};
                border-bottom: 1px solid ${color4};
                background-color: ${color2};
            }
        `,
        lifecycleToken
    )
);
export interface FloatingWindowProps {
    x: DataSource<number> | number;
    y: DataSource<number> | number;
    w: DataSource<number> | number;
    h: DataSource<number> | number;

    minW?: DataSource<number> | number;
    maxW?: DataSource<number> | number;
    minH?: DataSource<number> | number;
    maxH?: DataSource<number> | number;

    onClickOutside?(e: MouseEvent, windowRef: Renderable): void;
    onClickInside?(e: MouseEvent, windowRef: Renderable): void;
    onEscape?(e: KeyboardEvent, windowRef: Renderable): void;
    onClose?(e: MouseEvent, windowRef: Renderable): void;

    resizable?: boolean | DataSource<boolean>;
    minimizable?: boolean | DataSource<boolean>;
    maximizable?: boolean | DataSource<boolean>;
    maximized?: boolean | DataSource<boolean>;
    closable?: boolean | DataSource<boolean>;
    draggable?: boolean | DataSource<boolean>;
    fullscreenable?: boolean | DataSource<boolean>;
    alwaysOnTop?: boolean | DataSource<boolean>;
}

export function FloatingWindow(props: FloatingWindowProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const title = children.find((c) => (c as AurumElementModel<any>).factory === WindowTitle);
    const content = children.find((c) => (c as AurumElementModel<any>).factory === WindowContent);
    const x = props.x instanceof DataSource ? props.x : new DataSource(props.x);
    const y = props.y instanceof DataSource ? props.y : new DataSource(props.y);
    const w = props.w instanceof DataSource ? props.w : new DataSource(props.w);
    const h = props.h instanceof DataSource ? props.h : new DataSource(props.h);

    const maxW = props.maxW instanceof DataSource ? props.maxW : new DataSource(window.innerWidth);
    const maxH = props.maxH instanceof DataSource ? props.maxH : new DataSource(window.innerHeight);

    const closable = props.closable instanceof DataSource ? props.closable : new DataSource(props.closable ?? false);
    const maximizable = props.maximizable instanceof DataSource ? props.maximizable : new DataSource(props.maximizable ?? false);
    const maximized = props.maximized instanceof DataSource ? props.maximized : new DataSource(props.maximized ?? false);

    let dragging = new DataSource(false);
    let anchorX: number;
    let anchorY: number;
    let startX: number;
    let startY: number;

    let oldX: number;
    let oldY: number;
    let oldW: number;
    let oldH: number;

    if (maximized.value) {
        maximize();
    }

    return (
        <div style={x.aggregate([y, w, h], (x, y, w, h) => `left:${x}px; top:${y}px; width:${w}px; height:${h}px`)} class={style}>
            <div
                onMouseDown={(e) => {
                    if (getValueOf(props.draggable) && !maximized.value) {
                        dragging.update(true);
                        anchorX = e.screenX;
                        anchorY = e.screenY;
                        startX = x.value;
                        startY = y.value;

                        api.cancellationToken.registerDomEvent(window, 'mouseup', () => {
                            dragging.update(false);
                        });
                        api.cancellationToken.registerDomEvent(window, 'mousemove', (e: MouseEvent) => {
                            if (dragging.value) {
                                x.update(startX + e.screenX - anchorX);
                                y.update(startY + e.screenY - anchorY);
                            }
                        });
                    }
                }}
                class="floating-title"
            >
                <div>{(title as AurumElementModel<any>).children}</div>
                <div class="window-actions">
                    {maximizable.transform(
                        dsMap((v) =>
                            v ? (
                                <Button
                                    onClick={(e) => {
                                        if (maximized.value) {
                                            maximized.update(false);
                                            x.update(oldX);
                                            y.update(oldY);
                                            w.update(oldW);
                                            h.update(oldH);
                                        } else {
                                            maximize();
                                        }
                                    }}
                                >
                                    🗖
                                </Button>
                            ) : (
                                undefined
                            )
                        )
                    )}
                    {closable.transform(dsMap((v) => (v ? <Button onClick={(e) => props.onClose?.(e, this)}>⨯</Button> : undefined)))}
                </div>
            </div>
            <div class="floating-body">{(content as AurumElementModel<any>).children}</div>
        </div>
    );

    function maximize() {
        oldX = x.value;
        oldY = y.value;
        oldW = w.value;
        oldH = h.value;
        x.update(0);
        y.update(0);
        w.update(maxW.value);
        h.update(maxH.value);
        maximized.update(true);
    }
}

export function WindowTitle(props: {}, children: Renderable[]) {
    return undefined;
}

export function WindowContent(props: {}, children: Renderable[]) {
    return undefined;
}
