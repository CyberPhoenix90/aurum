import {
    AurumElement,
    Aurum,
    DataSource,
    ArrayDataSource,
    DuplexDataSource,
    aurumElementModelIdentitiy,
    CancellationToken,
    Renderable,
    AurumComponentAPI,
    EventEmitter,
    dsUnique,
    createLifeCycle,
    ReadOnlyDataSource,
    ClassType,
    dsMap
} from 'aurumjs';
import { ComponentModel, ComponentType } from './component_model.js';
import { RectangleComponentModel } from './drawables/aurum_rectangle.js';
import { TextComponentModel } from './drawables/aurum_text.js';
import { LineComponentModel } from './drawables/aurum_line.js';
import { ElipseComponentModel } from './drawables/aurum_elipse.js';
import { stateSymbol, StateComponentModel } from './drawables/state.js';
import { PathComponentModel } from './drawables/aurum_path.js';
import { QuadraticCurveComponentModel } from './drawables/aurum_quadratic_curve.js';
import { BezierCurveComponentModel } from './drawables/aurum_bezier_curve.js';
import { deref } from './utilities.js';
import {
    renderPath,
    renderRectangle,
    renderText,
    renderLine,
    renderQuadraticCurve,
    renderBezierCurve,
    renderElipse,
    renderRegularPolygon
} from './rendering.js';
import { initializeKeyboardPanningFeature, initializeMousePanningFeature, initializeZoomFeature } from './features.js';
import { StyleType } from 'aurumjs/prebuilt/esnext/utilities/common.js';

export interface AurumnCanvasFeatures {
    mouseWheelZoom?: {
        zoomIncrements: number;
        maxZoom: number;
        minZoom: number;
    };
    panning?: {
        // minX?: number;
        // minY?: number;
        // maxX?: number;
        // maxY?: number;
        mouse: boolean;
        keyboard?: {
            upKeyCode: number;
            rightKeyCode: number;
            leftKeyCode: number;
            downKeyCode: number;
            pixelsPerFrame: number;
        };
    };
}

const renderCache = new WeakMap();
export interface AurumCanvasProps {
    backgroundColor?: DataSource<string> | string;
    onAttach?(canvas: HTMLCanvasElement): void;
    onDetach?(): void;
    class?: ClassType;
    style?: StyleType;
    width?: ReadOnlyDataSource<string | number> | ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | string | number;
    height?: ReadOnlyDataSource<string | number> | ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | string | number;
    translate?: DataSource<{ x: number; y: number }>;
    scale?: DataSource<{ x: number; y: number }>;
    features?: AurumnCanvasFeatures;
}

export function AurumCanvas(props: AurumCanvasProps, children: Renderable[], api: AurumComponentAPI): AurumElement {
    const lc = createLifeCycle();
    api.synchronizeLifeCycle(lc);
    const components = api.prerender(children, lc);
    let pendingRerender;
    const cancellationToken: CancellationToken = new CancellationToken();
    let onMouseMove: EventEmitter<MouseEvent> = new EventEmitter();
    let onMouseUp: EventEmitter<MouseEvent> = new EventEmitter();
    let onMouseDown: EventEmitter<MouseEvent> = new EventEmitter();

    return (
        <canvas
            onAttach={(canvas) => {
                if (props.features) {
                    if (!props.scale) {
                        props.scale = new DataSource({ x: 1, y: 1 });
                    }

                    if (!props.translate) {
                        props.translate = new DataSource({ x: 0, y: 0 });
                    }

                    if (props.features.mouseWheelZoom) {
                        initializeZoomFeature(props, canvas);
                    }
                    if (props.features.panning?.mouse) {
                        initializeMousePanningFeature(props, canvas);
                    }
                    if (props.features.panning?.keyboard) {
                        initializeKeyboardPanningFeature(props, canvas);
                    }
                }

                if (props.width instanceof DataSource) {
                    props.width.listen(() => {
                        invalidate(canvas);
                    }, api.cancellationToken);
                }

                if (props.backgroundColor instanceof DataSource) {
                    props.backgroundColor.listen(() => {
                        invalidate(canvas);
                    }, api.cancellationToken);
                }

                if (props.height instanceof DataSource) {
                    props.height.listen(() => {
                        invalidate(canvas);
                    }, api.cancellationToken);
                }

                bindCanvas(canvas, components, cancellationToken);
                render(canvas, components);
                if (props.translate) {
                    props.translate.transform(dsUnique(), api.cancellationToken).listen((v) => {
                        invalidate(canvas);
                    });
                }
                if (props.scale) {
                    props.scale.transform(dsUnique(), api.cancellationToken).listen((v) => {
                        invalidate(canvas);
                    });
                }
                props.onAttach?.(canvas);
            }}
            onDetach={() => {
                cancellationToken.cancel();
                props.onDetach?.();
            }}
            style={props.style}
            class={props.class}
            width={typeof props.width !== 'object' ? props.width?.toString() : (props.width.transform(dsMap<string | number, string>((v) => v.toString())) as DataSource<string>)}
            height={typeof props.height !== 'object' ? props.height?.toString() : (props.height.transform(dsMap<string | number, string>((v) => v.toString())) as DataSource<string>)}
        ></canvas>
    );

    function bindCanvas(canvas: HTMLCanvasElement, components: ComponentModel[], cancellationToken: CancellationToken) {
        cancellationToken.registerDomEvent(canvas, 'mouseleave', (e) => {
            onMouseMove.fire(e as MouseEvent);
        });
        cancellationToken.registerDomEvent(canvas, 'mousemove', (e) => {
            onMouseMove.fire(e as MouseEvent);
        });
        cancellationToken.registerDomEvent(canvas, 'mousedown', (e) => {
            onMouseDown.fire(e as MouseEvent);
        });
        cancellationToken.registerDomEvent(canvas, 'mouseup', (e) => {
            onMouseUp.fire(e as MouseEvent);
        });

        bind(canvas, components, undefined, cancellationToken);
    }

    function isOnTopOf(e: MouseEvent, target: ComponentModel, context: CanvasRenderingContext2D): boolean {
        if (!target.renderedState) {
            return false;
        }
        let x = e.offsetX - (props.translate?.value.x ? props.translate?.value.x * (props.scale?.value?.x ?? 1) : 0);
        let y = e.offsetY - (props.translate?.value.y ? props.translate?.value.y * (props.scale?.value?.x ?? 1) : 0);
        if (props.scale) {
            x /= props.scale.value.x;
            y /= props.scale.value.y;
        }

        if (target.type === ComponentType.TEXT) {
            const label = target as TextComponentModel;
            const size = deref(label.fontSize) ?? 16;
            if (!label.textBaseline) {
                y += size;
            } else {
                switch (label.textBaseline) {
                    case 'bottom':
                        y += size;
                        break;
                    case 'middle':
                        y += size / 2;
                        break;
                    case 'alphabetic':
                        y += size;
                        break;
                }
            }
        }

        switch (target.type) {
            case ComponentType.IMAGE:
            case ComponentType.RECTANGLE:
            case ComponentType.TEXT:
                return (
                    x >= target.renderedState.x &&
                    y >= target.renderedState.y &&
                    x <= target.renderedState.x + target.renderedState.width * (props.scale?.value.x ?? 1) &&
                    y <= target.renderedState.y + target.renderedState.height * (props.scale?.value.y ?? 1)
                );
            case ComponentType.ELIPSE:
            case ComponentType.REGULAR_POLYGON:
                if (!target.renderedState.path) {
                    return false;
                } else {
                    return context.isPointInPath(target.renderedState.path, x, y);
                }
            default:
                if (!target.renderedState.path) {
                    return false;
                } else {
                    return context.isPointInPath(target.renderedState.path, x - target.renderedState.x, y - target.renderedState.y);
                }
        }
    }

    function bind(canvas: HTMLCanvasElement, children: ComponentModel[], parent: ComponentModel, cancellationToken: CancellationToken): void {
        for (const child of children) {
            if (child instanceof ArrayDataSource) {
                child.listen(() => invalidate(canvas), cancellationToken);
                const tokenMap = new Map<any, CancellationToken>();
                child.listenAndRepeat((change) => {
                    switch (change.operation) {
                        case 'add':
                            for (const item of change.items) {
                                tokenMap.set(item, new CancellationToken());
                                bindDynamicEntity(item, child, tokenMap.get(item));
                            }
                            break;
                        case 'remove':
                            for (const item of change.items) {
                                tokenMap.get(item).cancel();
                                tokenMap.delete(item);
                            }
                            break;

                        case 'replace':
                            tokenMap.get(change.target).cancel();
                            tokenMap.delete(change.target);
                            tokenMap.set(change.items[0], new CancellationToken());
                            bindDynamicEntity(change.items[0], child, tokenMap.get(change.items[0]));
                            break;
                        case 'swap':
                            break;
                        case 'merge':
                            throw new Error('Operation not supported');
                    }
                });
                continue;
            }

            if (child instanceof DataSource || child instanceof DuplexDataSource) {
                child.listen(() => invalidate(canvas), cancellationToken);
                let bindToken: CancellationToken;
                let value;
                child.listenAndRepeat((newValue) => {
                    if (value !== newValue) {
                        value = newValue;
                        if (bindToken) {
                            bindToken.cancel();
                        }
                        bindToken = new CancellationToken();
                        bindDynamicEntity(value, child, bindToken);
                    }
                });
                continue;
            }

            if (child[stateSymbol]) {
                if (!parent) {
                    throw new Error('Cannot use <State> nodes at root level');
                }
                parent.animations.push(child as StateComponentModel);
                continue;
            }
            if ('onMouseEnter' in child || 'onMouseLeave' in child) {
                let isInside = false;
                onMouseMove.subscribe((e) => {
                    if (isOnTopOf(e, child, canvas.getContext('2d'))) {
                        if (!isInside && child.onMouseEnter) {
                            child.onMouseEnter(e, child);
                        }
                        isInside = true;
                    } else {
                        if (isInside && child.onMouseLeave) {
                            child.onMouseLeave(e, child);
                        }
                        isInside = false;
                    }
                }, cancellationToken);
            }

            for (const key in child) {
                if (key === 'onMouseUp') {
                    onMouseUp.subscribe((e) => {
                        if (isOnTopOf(e, child, canvas.getContext('2d'))) {
                            child.onMouseUp(e, child);
                        }
                    }, cancellationToken);
                    continue;
                }

                if (key === 'onMouseDown') {
                    onMouseUp.subscribe((e) => {
                        if (isOnTopOf(e, child, canvas.getContext('2d'))) {
                            child.onMouseUp(e, child);
                        }
                    }, cancellationToken);
                    continue;
                }

                if (key === 'onMouseClick') {
                    onMouseUp.subscribe((e) => {
                        if (isOnTopOf(e, child, canvas.getContext('2d'))) {
                            child.onMouseClick(e, child);
                        }
                    }, cancellationToken);
                    continue;
                }

                if (child[key] instanceof DataSource) {
                    let value = child[key].value;
                    let lastState;
                    if (key === 'state') {
                        const value = deref(child[key]);
                        lastState = value;
                        child.animationStates = child.animations.filter((e) => e.id === value);
                        child.animationTime = Date.now();
                    }

                    child[key].listen((newValue) => {
                        if (value !== newValue) {
                            value = newValue;
                            if (key === 'state') {
                                if (lastState !== newValue) {
                                    lastState = newValue;
                                    child.animationStates = child.animations.filter((e) => e.id === newValue);
                                    child.animationTime = Date.now();
                                    invalidate(canvas);
                                }
                            } else {
                                invalidate(canvas);
                            }
                        }
                    }, cancellationToken);
                }
            }

            bind(canvas, child.children, child, cancellationToken);
        }

        function bindDynamicEntity(value: any, parent: ComponentModel, bindToken: CancellationToken) {
            const arrayedValue = Array.isArray(value) ? value : [value];
            const lc = createLifeCycle();
            const renderResult = [];
            for (const piece of arrayedValue) {
                if (!piece) {
                    continue;
                }

                if (!renderCache.has(piece)) {
                    renderCache.set(piece, api.prerender(piece, lc));
                }
                renderResult.push(renderCache.get(piece));
            }

            bind(canvas, renderResult, parent, bindToken);
            lc.onAttach();
            bindToken.addCancelable(() => lc.onDetach());
            invalidate(canvas);
        }
    }

    function invalidate(canvas: HTMLCanvasElement): void {
        if (!pendingRerender) {
            pendingRerender = requestAnimationFrame(() => {
                pendingRerender = undefined;
                if (canvas.isConnected) {
                    render(canvas, components as any);
                }
            });
        }
    }

    function render(canvas: HTMLCanvasElement, components: ComponentModel[]): void {
        const context = canvas.getContext('2d');
        if (props.backgroundColor === undefined) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            context.fillStyle = deref(props.backgroundColor);
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        applyContextTransformation(context);
        for (const child of components) {
            renderChild(context, child, 0, 0);
        }
        unapplyContextTransformation(context);
    }

    function unapplyContextTransformation(context: CanvasRenderingContext2D) {
        if (props.scale || props.translate) {
            context.restore();
        }
    }

    function applyContextTransformation(context: CanvasRenderingContext2D) {
        if (props.scale || props.translate) {
            context.save();
            if (props.scale?.value) {
                context.scale(props.scale.value.x, props.scale.value.y);
            }
            if (props.translate?.value) {
                context.translate(props.translate.value.x, props.translate.value.y);
            }
        }
    }

    function renderChild(context: CanvasRenderingContext2D, child: ComponentModel, offsetX: number, offsetY: number): void {
        if (child === undefined || child === null) {
            return;
        }

        if (Array.isArray(child)) {
            for (const item of child) {
                renderChild(context, item, offsetX, offsetY);
            }
            return;
        }

        if (child[stateSymbol]) {
            return;
        }

        if (child[aurumElementModelIdentitiy]) {
            if (!renderCache.has(child)) {
                throw new Error('illegal state: unrendered aurum element made it into the canvas render phase');
            }
            child = renderCache.get(child);
        }
        if (child instanceof ArrayDataSource) {
            for (const node of child.getData()) {
                renderChild(context, node, offsetX, offsetY);
            }
            return;
        }

        if (child instanceof DataSource || child instanceof DuplexDataSource) {
            renderChild(context, child.value, offsetX, offsetY);
            return;
        }

        context.save();
        let idle: boolean;
        switch (child.type) {
            case ComponentType.PATH:
                idle = renderPath(context, child as PathComponentModel, offsetX, offsetY);
                break;
            case ComponentType.REGULAR_POLYGON:
                idle = renderRegularPolygon(context, child as PathComponentModel, offsetX, offsetY);
                break;
            case ComponentType.RECTANGLE:
                idle = renderRectangle(context, child as RectangleComponentModel, offsetX, offsetY);
                break;
            case ComponentType.TEXT:
                idle = renderText(context, child as TextComponentModel, offsetX, offsetY);
                break;
            case ComponentType.LINE:
                idle = renderLine(context, child as LineComponentModel, offsetX, offsetY);
                break;
            case ComponentType.QUADRATIC_CURVE:
                idle = renderQuadraticCurve(context, child as QuadraticCurveComponentModel, offsetX, offsetY);
                break;
            case ComponentType.BEZIER_CURVE:
                idle = renderBezierCurve(context, child as BezierCurveComponentModel, offsetX, offsetY);
                break;
            case ComponentType.ELIPSE:
                idle = renderElipse(context, child as ElipseComponentModel, offsetX, offsetY);
                break;
            case ComponentType.GROUP:
                idle = true;
                break;
        }
        if (!idle) {
            invalidate(context.canvas);
        }

        for (const subChild of child.children) {
            renderChild(context, subChild, deref(child.x) + offsetX, deref(child.y) + offsetY);
        }
        context.restore();
    }
}
