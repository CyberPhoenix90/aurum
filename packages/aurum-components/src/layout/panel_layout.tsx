import { css } from '@emotion/css';
import {
    AttributeValue,
    Aurum,
    AurumComponentAPI,
    AurumElementModel,
    ClassType,
    combineAttribute,
    combineClass,
    DataSource,
    dsMap,
    DuplexDataSource,
    Renderable
} from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';
import {
    PanelContent,
    PanelDockBottom,
    PanelDockLeft,
    PanelDockRight,
    PanelDockTop,
    PanelElementProps,
    renderBottomDock,
    renderLeftDock,
    renderRightDock,
    renderTopDock
} from './panel_dock.js';

export interface PanelProps {
    class?: string;
    style?: string;
    dragHandleThickness?: number;
}

export function PanelComponent(props: PanelProps, children: AurumElementModel<any>[], { cancellationToken }: AurumComponentAPI): Renderable {
    const style = generateStyle(props);

    children = children.filter(Boolean);

    let left: AurumElementModel<PanelElementProps>;
    let right: AurumElementModel<PanelElementProps>;
    let top: AurumElementModel<PanelElementProps>;
    let bottom: AurumElementModel<PanelElementProps>;
    let content: AurumElementModel<{ style?: AttributeValue; class?: ClassType }>;

    for (const child of children) {
        if (child.factory === PanelDockLeft) {
            if (!left) {
                left = child;
            } else {
                throw new Error('only one left sidebar supported per panel');
            }
        } else if (child.factory === PanelContent) {
            if (!content) {
                content = child;
            } else {
                throw new Error('only one conent element supported per panel');
            }
        } else if (child.factory === PanelDockBottom) {
            if (!bottom) {
                bottom = child;
            } else {
                throw new Error('only one bottom bar supported per panel');
            }
        } else if (child.factory === PanelDockRight) {
            if (!right) {
                right = child;
            } else {
                throw new Error('only one right sidebar supported per panel');
            }
        } else if (child.factory === PanelDockTop) {
            if (!top) {
                top = child;
            } else {
                throw new Error('only one top bar supported per panel');
            }
        } else {
            throw new Error('unspported child type. Only PanelDockLeft, PanelDockRight, PanelDockTop, PanelDockBottom and PanelContent is supported');
        }
    }

    const leftDockSize =
        left?.props.size instanceof DuplexDataSource || left?.props.size instanceof DataSource ? left.props.size : new DataSource(left?.props.size ?? 0);
    const topDockSize =
        top?.props.size instanceof DuplexDataSource || top?.props.size instanceof DataSource ? top.props.size : new DataSource(top?.props.size ?? 0);
    const rightDockSize =
        right?.props.size instanceof DataSource || right?.props.size instanceof DuplexDataSource ? right.props.size : new DataSource(right?.props.size ?? 0);
    const bottomDockSize =
        bottom?.props.size instanceof DataSource || bottom?.props.size instanceof DuplexDataSource
            ? bottom.props.size
            : new DataSource(bottom?.props.size ?? 0);

    const leftDockminSize =
        left?.props.minSize instanceof DuplexDataSource || left?.props.minSize instanceof DataSource
            ? left.props.minSize
            : new DataSource(left?.props.minSize ?? 0);
    //@ts-ignore
    const topDockminSize =
        top?.props.minSize instanceof DuplexDataSource || top?.props.minSize instanceof DataSource
            ? top.props.minSize
            : new DataSource(top?.props.minSize ?? 0);
    const rightDockminSize =
        right?.props.minSize instanceof DataSource || right?.props.minSize instanceof DuplexDataSource
            ? right.props.minSize
            : new DataSource(right?.props.minSize ?? 0);
    const bottomDockminSize =
        bottom?.props.minSize instanceof DataSource || bottom?.props.minSize instanceof DuplexDataSource
            ? bottom.props.minSize
            : new DataSource(bottom?.props.minSize ?? 0);

    const leftDockmaxSize =
        left?.props.maxSize instanceof DuplexDataSource || left?.props.maxSize instanceof DataSource
            ? left.props.maxSize
            : new DataSource(left?.props.maxSize ?? Number.MAX_SAFE_INTEGER);
    //@ts-ignore
    const topDockmaxSize =
        top?.props.maxSize instanceof DuplexDataSource || top?.props.maxSize instanceof DataSource
            ? top.props.maxSize
            : new DataSource(top?.props.maxSize ?? Number.MAX_SAFE_INTEGER);
    const rightDockmaxSize =
        right?.props.maxSize instanceof DataSource || right?.props.maxSize instanceof DuplexDataSource
            ? right.props.maxSize
            : new DataSource(right?.props.maxSize ?? Number.MAX_SAFE_INTEGER);
    const bottomDockmaxSize =
        bottom?.props.maxSize instanceof DataSource || bottom?.props.maxSize instanceof DuplexDataSource
            ? bottom.props.maxSize
            : new DataSource(bottom?.props.maxSize ?? Number.MAX_SAFE_INTEGER);

    return (
        <div style={props.style} class={style.transform(dsMap((e) => `${e} ${props.class ?? ''}`)) as DataSource<string>}>
            {left ? renderLeftDock(left, leftDockSize, leftDockminSize, leftDockmaxSize, cancellationToken, props.dragHandleThickness) : undefined}
            <div
                style={leftDockSize.aggregate(
                    [rightDockSize],
                    (leftSize, rightSize) => `float:left;width:calc(100% - ${leftSize}px - ${rightSize}px); height:100%;`
                )}
            >
                {top ? renderTopDock(top, topDockSize, cancellationToken) : undefined}
                <div
                    class={combineClass(cancellationToken, 'content', content.props?.class)}
                    style={topDockSize.aggregate(
                        [bottomDockSize, leftDockSize],
                        (topSize, bottomSize) =>
                            combineAttribute(
                                cancellationToken,
                                `float:left; width:100%;height:calc(100% - ${topSize}px - ${bottomSize}px);`,
                                content.props?.style
                            ) as any
                    )}
                >
                    {content.children}
                </div>
                {bottom
                    ? renderBottomDock(bottom, bottomDockSize, bottomDockminSize, bottomDockmaxSize, cancellationToken, props.dragHandleThickness)
                    : undefined}
            </div>
            {right ? renderRightDock(right, rightDockSize, rightDockminSize, rightDockmaxSize, cancellationToken, props.dragHandleThickness) : undefined}
        </div>
    );
}

function generateStyle(props: PanelProps) {
    return aurumify([currentTheme], (theme, lifecycleToken) =>
        aurumify(
            [theme.baseFontColor, theme.themeColor1, theme.themeColor3, theme.themeColor2],
            (fontColor, color1, color3, color2) => css`
                color: ${fontColor};
                border-color: ${color3};
                background-color: ${color2};
                width: 100%;
                height: 100%;

                .left-dock,
                .top-dock,
                .right-dock,
                .bottom-dock,
                .panel-content {
                    overflow: auto;
                    position: relative;
                }

                .left-dock {
                    float: left;
                }

                .right-dock {
                    float: right;
                }

                .vertical-handle {
                    cursor: ew-resize;
                    width: ${props.dragHandleThickness ?? 2}px;
                    background-color: ${color3};
                    height: 100%;
                }

                .horizontal-handle {
                    cursor: ns-resize;
                    height: ${props.dragHandleThickness ?? 2}px;
                    background-color: ${color3};
                    width: 100%;
                }
            `,
            lifecycleToken
        )
    );
}
