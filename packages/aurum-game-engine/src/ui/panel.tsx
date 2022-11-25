import { ArrayDataSource, Aurum, AurumComponentAPI, DataSource, Renderable } from 'aurumjs';
import { AbstractComponent } from '../entities/components/abstract_component.js';
import { MouseInteractionComponent } from '../entities/components/mouse_interaction_component.js';
import { Canvas, PaintOperation } from '../entities/types/canvas/canvas_entity.js';
import { Container, ContainerEntityProps } from '../entities/types/container/container_entity.js';
import { Color } from '../graphics/color.js';
import { RoundedRectangle } from '../math/shapes/rounded_rectangle.js';
import { CommonEntity } from '../models/entities.js';
import { Data } from '../models/input_data.js';
import { SceneGraphNode } from '../models/scene_graph.js';
import { toSourceIfDefined } from '../utilities/data/to_source.js';

export interface PanelProps extends ContainerEntityProps {
    hover?: {
        background?: Data<string | Color>;
        borderRadius?: Data<number>;
        border?: {
            radius?: Data<number>;
            thickness: Data<number>;
            color: Data<string | Color>;
        };
    };
    background?: Data<string | Color>;
    border?: {
        radius?: Data<number>;
        thickness: Data<number>;
        color: Data<string | Color>;
    };
    paddingTop?: Data<number>;
    paddingBottom?: Data<number>;
    paddingRight?: Data<number>;
    paddingLeft?: Data<number>;
    padding?: Data<number>;

    onClick?(e: { e: MouseEvent; source: SceneGraphNode<CommonEntity> }): void;
    onMouseDown?(e: { e: MouseEvent; source: SceneGraphNode<CommonEntity> }): void;
    onMouseUp?(e: { e: MouseEvent; source: SceneGraphNode<CommonEntity> }): void;
    onMouseMove?(e: { e: MouseEvent; source: SceneGraphNode<CommonEntity> }): void;
    onMouseEnter?(e: { e: MouseEvent; source: SceneGraphNode<CommonEntity> }): void;
    onMouseLeave?(e: { e: MouseEvent; source: SceneGraphNode<CommonEntity> }): void;
    onScroll?(e: { e: WheelEvent; source: SceneGraphNode<CommonEntity> }): void;
}

export function Panel(props: PanelProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const hover = new DataSource(false);
    const leftPadding =
        props.paddingLeft ?? props.padding
            ? DataSource.fromAggregation([toSourceIfDefined(props.paddingLeft), toSourceIfDefined(props.padding)], (l, s) => {
                  return l ?? s;
              })
            : undefined;

    const rightPadding =
        props.paddingRight ?? props.padding
            ? DataSource.fromAggregation([toSourceIfDefined(props.paddingRight), toSourceIfDefined(props.padding)], (r, s) => {
                  return r ?? s;
              })
            : undefined;

    const topPadding =
        props.paddingTop ?? props.padding
            ? DataSource.fromAggregation([toSourceIfDefined(props.paddingTop), toSourceIfDefined(props.padding)], (t, s) => {
                  return t ?? s;
              })
            : undefined;

    const bottomPadding =
        props.paddingBottom ?? props.padding
            ? DataSource.fromAggregation([toSourceIfDefined(props.paddingBottom), toSourceIfDefined(props.padding)], (b, s) => {
                  return b ?? s;
              })
            : undefined;

    const leftMargin =
        props.marginLeft ?? props.margin
            ? DataSource.fromAggregation([toSourceIfDefined(props.marginLeft), toSourceIfDefined(props.margin)], (l, s) => {
                  return l ?? s;
              })
            : undefined;

    const rightMargin =
        props.marginRight ?? props.margin
            ? DataSource.fromAggregation([toSourceIfDefined(props.marginRight), toSourceIfDefined(props.margin)], (r, s) => {
                  return r ?? s;
              })
            : undefined;

    const topMargin =
        props.marginTop ?? props.margin
            ? DataSource.fromAggregation([toSourceIfDefined(props.marginTop), toSourceIfDefined(props.margin)], (t, s) => {
                  return t ?? s;
              })
            : undefined;

    const bottomMargin =
        props.marginBottom ?? props.margin
            ? DataSource.fromAggregation([toSourceIfDefined(props.marginBottom), toSourceIfDefined(props.margin)], (b, s) => {
                  return b ?? s;
              })
            : undefined;

    let borderThickness = toSourceIfDefined(props.border?.thickness) ?? new DataSource(0);
    let borderColor = toSourceIfDefined(props.border?.color) ?? new DataSource('transparent');
    let borderRadius = toSourceIfDefined(props.border?.radius) ?? new DataSource(0);

    if (props.hover?.border?.radius) {
        borderRadius = borderRadius.aggregate([toSourceIfDefined(props.hover.border.radius), hover], (br, hbr, h) => (h ? hbr : br));
    }

    if (props.hover?.border?.thickness) {
        borderThickness = borderThickness.aggregate([toSourceIfDefined(props.hover.border.thickness), hover], (bt, hbt, h) => (h ? hbt : bt));
    }

    if (props.hover?.border?.color) {
        borderColor = borderColor.aggregate([toSourceIfDefined(props.hover.border.color), hover], (bc, hbc, h) => (h ? hbc : bc));
    }

    let background = toSourceIfDefined(props.background) ?? new DataSource<string | Color>(undefined);
    if (props.hover?.background) {
        background = background.aggregate([toSourceIfDefined(props.hover.background), hover], (bg, hbg, h) => (h ? hbg : bg));
    }

    const drawing = new ArrayDataSource<PaintOperation>();

    return (
        <Container
            x={props.x}
            y={props.y}
            originX={props.originX}
            originY={props.originY}
            visible={props.visible}
            components={[createMouseComponent(props, hover)]}
            marginBottom={DataSource.fromAggregation([bottomMargin, borderThickness, bottomPadding], (b = 0, t = 0, p = 0) => b + t + p)}
            marginTop={DataSource.fromAggregation([topMargin, borderThickness, topPadding], (b = 0, t = 0, p = 0) => b + t + p)}
            marginLeft={DataSource.fromAggregation([leftMargin, borderThickness, leftPadding], (b = 0, t = 0, p = 0) => b + t + p)}
            marginRight={DataSource.fromAggregation([rightMargin, borderThickness, rightPadding], (b = 0, t = 0, p = 0) => b + t + p)}
            width={DataSource.fromAggregation(
                [DataSource.toDataSource(props.width), leftPadding, rightPadding],
                (v = 0, l = 0, r = 0) => `(${typeof v === 'number' ? v + 'px' : v}) + ${l}px + ${r}px`
            )}
            height={DataSource.fromAggregation(
                [DataSource.toDataSource(props.height), topPadding, bottomPadding],
                (v = 0, l = 0, r = 0) => `(${typeof v === 'number' ? v + 'px' : v}) + ${l}px + ${r}px`
            )}
            alpha={props.alpha}
            blendMode={props.blendMode}
            class={props.class}
            clip={props.clip}
            layout={props.layout}
            rotation={props.rotation}
            onDetach={props.onDetach}
            scaleX={props.scaleX}
            scaleY={props.scaleY}
            shaders={props.shaders}
            zIndex={props.zIndex}
            name="Panel"
            onAttach={(node) => {
                node.renderState.width.aggregate(
                    [node.renderState.height, borderThickness, borderColor, borderRadius, background],
                    (width, height, bt, bc, br, bg) => {
                        drawing.clear();
                        if (bt && bc) {
                            let color: string;
                            if (typeof bc === 'string') {
                                color = bc;
                            } else {
                                color = bc.toRGBA();
                            }
                            drawing.push({
                                strokeStyle: color,
                                strokeThickness: bt,
                                strokeAlignment: 1,
                                shape: new RoundedRectangle({ x: 0, y: 0 }, { x: width, y: height }, br)
                            });
                        }
                        if (bg) {
                            const draw: PaintOperation = {};
                            if (typeof bg === 'string') {
                                draw.fillStyle = bg;
                            } else {
                                draw.fillStyle = bg.toRGBA();
                            }
                            draw.shape = new RoundedRectangle({ x: 0, y: 0 }, { x: width, y: height }, br);
                            drawing.push(draw);
                        }
                    },
                    api.cancellationToken
                );
                props.onAttach?.(node);
            }}
        >
            <Canvas
                x={DataSource.fromAggregation([leftPadding], (p = 0) => -p)}
                y={DataSource.fromAggregation([topPadding], (p = 0) => -p)}
                width={DataSource.fromAggregation(
                    [borderThickness, leftMargin, rightMargin, leftPadding, rightPadding],
                    (t = 0, lm = 0, rm = 0, lp = 0, rp = 0) => `100% + ${t * 2 + lm + rm + lp + rp}px`
                )}
                height={DataSource.fromAggregation(
                    [borderThickness, topMargin, bottomMargin, topPadding, bottomPadding],
                    (t = 0, tm = 0, bm = 0, tp = 0, bp = 0) => `100% + ${t * 2 + tm + bm + tp + bp}px`
                )}
                name="PanelBackground"
                paintOperations={drawing}
            ></Canvas>
            {children}
        </Container>
    );
}
function createMouseComponent(props: PanelProps, hover: DataSource<boolean>): AbstractComponent {
    return new MouseInteractionComponent({
        onClick: props.onClick,
        onMouseDown: props.onMouseDown,
        onMouseEnter: (e) => {
            hover.update(true);
            props.onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
            hover.update(false);
            props.onMouseLeave?.(e);
        },
        onMouseMove: props.onMouseMove,
        onMouseUp: props.onMouseUp,
        onScroll: props.onScroll
    });
}
