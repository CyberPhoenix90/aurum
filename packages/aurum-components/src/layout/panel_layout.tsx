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
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';
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
} from './panel_dock';

export interface PanelProps {
    class?: string;
    style?: string;
    dragHandleThickness?: number;
}

export function PanelComponent(props: PanelProps, children: AurumElementModel<any>[], { className }: AurumComponentAPI): Renderable {
    const style = generateStyle(props);

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

    return (
        <div style={props.style} class={style.transform(dsMap((e) => `${e} ${props.class ?? ''}`)) as DataSource<string>}>
            {left ? renderLeftDock(left, leftDockSize, className, props.dragHandleThickness) : undefined}
            {top ? renderTopDock(top, topDockSize, leftDockSize, rightDockSize, className, props.dragHandleThickness) : undefined}
            <div
                class={combineClass('content', content.props?.class)}
                style={topDockSize.aggregate(
                    [leftDockSize, rightDockSize, bottomDockSize],
                    (topSize, leftSize, rightSize, bottomSize) =>
                        combineAttribute(
                            `float:left;;width:calc(100% - ${leftSize}px - ${rightSize}px); height:calc(100% - ${topSize}px - ${bottomSize}px);`,
                            content.props?.style
                        ) as any
                )}
            >
                {content.children}
            </div>
            {right ? renderRightDock(right, rightDockSize, className, props.dragHandleThickness) : undefined}
            {bottom ? renderBottomDock(bottom, bottomDockSize, leftDockSize, rightDockSize, className, props.dragHandleThickness) : undefined}
        </div>
    );
}

function generateStyle(props: PanelProps) {
    return aurumify([currentTheme], (theme, lifecycleToken) =>
        aurumify(
            [theme.baseFontColor, theme.themeColor1, theme.themeColor3, theme.themeColor2],
            (fontColor, color1, color3, color2) => css`
                background-color: ${color1};
                color: ${fontColor};
                border-color: ${color3};
                background-color: ${color2};
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: row;

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
