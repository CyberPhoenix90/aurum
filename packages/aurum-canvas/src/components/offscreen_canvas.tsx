import {
    ArrayDataSource,
    AurumComponentAPI,
    CancellationToken,
    ComponentLifeCycle,
    DataSource,
    EventEmitter,
    ReadOnlyDataSource,
    Renderable,
    aurumElementModelIdentitiy,
    createLifeCycle,
    dsUnique
} from '@aurum/rendering';
import { AurumCanvasFeatures } from './canvas_feature_model.js';
import { ComponentModel, ComponentType } from './component_model.js';
import { BezierCurveComponentModel } from './drawables/aurum_bezier_curve.js';
import { ElipseComponentModel } from './drawables/aurum_elipse.js';
import { LineComponentModel } from './drawables/aurum_line.js';
import { PathComponentModel } from './drawables/aurum_path.js';
import { QuadraticCurveComponentModel } from './drawables/aurum_quadratic_curve.js';
import { RectangleComponentModel } from './drawables/aurum_rectangle.js';
import { TextComponentModel } from './drawables/aurum_text.js';
import { StateComponentModel, stateSymbol } from './drawables/state.js';
import { initializeKeyboardPanningFeature, initializeMousePanningFeature, initializeZoomFeature } from './features.js';
import {
    renderBezierCurve,
    renderElipse,
    renderImage,
    renderLargeContentBox,
    renderLine,
    renderPath,
    renderQuadraticCurve,
    renderRectangle,
    renderRegularPolygon,
    renderText
} from './rendering.js';
import { deref } from './utilities.js';
import { SimplifiedKeyboardEvent, SimplifiedMouseEvent, SimplifiedWheelEvent } from './common_props.js';
import { ImageComponentModel } from './drawables/aurum_image.js';
import { LargeContentBoxModel } from './drawables/large_content_box.js';

const renderCache = new WeakMap<object, { rendered: unknown; lifeCycle: ComponentLifeCycle }>();
export interface AurumOffscreenCanvasProps {
    canvas: OffscreenCanvas | HTMLCanvasElement;
    backgroundColor?: ReadOnlyDataSource<string> | string;
    translate?: DataSource<{ x: number; y: number }>;
    scale?: DataSource<{ x: number; y: number }>;
    features?: AurumCanvasFeatures;
    /**
     * In case of auto size this will update to the current width of the canvas
     */
    readWidth?: DataSource<number>;
    /**
     * In case of auto size this will update to the current height of the canvas
     */
    readHeight?: DataSource<number>;
    onMouseMove: EventEmitter<SimplifiedMouseEvent>;
    onMouseClick: EventEmitter<SimplifiedMouseEvent>;
    onMouseUp: EventEmitter<SimplifiedMouseEvent>;
    onMouseDown: EventEmitter<SimplifiedMouseEvent>;
    onWheel: EventEmitter<SimplifiedWheelEvent>;
    onKeyUp: EventEmitter<SimplifiedKeyboardEvent>;
    onKeyDown: EventEmitter<SimplifiedKeyboardEvent>;
    invalidate: EventEmitter<void>;
}

export function AurumOffscreenCanvas(props: AurumOffscreenCanvasProps, children: Renderable[], api: AurumComponentAPI): void {
    const lc = createLifeCycle();
    api.synchronizeLifeCycle(lc);
    const components = api.prerender(children, lc);
    let pendingRerender: number | undefined;
    const cancellationToken: CancellationToken = new CancellationToken();
    let cursorOwner: ComponentModel | undefined;
    let paintOrder: ComponentModel[] = [];
    let hovered = new Set<ComponentModel>();
    const requestRender = () => {
        if (!cancellationToken.isCancelled) {
            invalidate(props.canvas);
        }
    };
    api.cancellationToken.addCancellable(cancellationToken);
    cancellationToken.addCancellable(() => {
        if (pendingRerender !== undefined) {
            cancelAnimationFrame(pendingRerender);
        }
    });

    props.readHeight?.update(props.canvas.height);
    props.readWidth?.update(props.canvas.width);

    if (props.features) {
        if (!props.scale) {
            props.scale = new DataSource({ x: 1, y: 1 });
        }

        if (!props.translate) {
            props.translate = new DataSource({ x: 0, y: 0 });
        }

        if (props.features.mouseWheelZoom) {
            initializeZoomFeature(props, props.onWheel, api.cancellationToken);
        }
        if (props.features.panning?.mouse) {
            initializeMousePanningFeature(props, props.onMouseDown, props.onMouseMove, props.onMouseUp, api.cancellationToken);
        }
        if (props.features.panning?.keyboard) {
            initializeKeyboardPanningFeature(props, props.onKeyUp, props.onKeyDown, api.cancellationToken);
        }
    }

    if (props.backgroundColor instanceof DataSource) {
        props.backgroundColor.listen(() => {
            invalidate(props.canvas);
        }, api.cancellationToken);
    }

    props.invalidate.subscribe(() => invalidate(props.canvas), cancellationToken);

    bind(props.canvas, components, undefined, cancellationToken);
    render(props.canvas, components);
    if (props.translate) {
        props.translate.transform(dsUnique(), api.cancellationToken).listen((v) => {
            invalidate(props.canvas);
        });
    }
    if (props.scale) {
        props.scale.transform(dsUnique(), api.cancellationToken).listen((v) => {
            invalidate(props.canvas);
        });
    }

    props.onMouseMove.subscribe((event) => {
        const nextHovered = new Set<ComponentModel>();
        const targets = hitTargets(event);

        for (const target of hovered) {
            if (!targets.includes(target)) {
                target.readIsHovering.update(false);
                target.onMouseLeave?.(event, target);
            }
        }

        for (const target of targets) {
            nextHovered.add(target);
            if (!hovered.has(target)) {
                target.readIsHovering.update(true);
                target.onMouseEnter?.(event, target);
            }
            target.onMouseMove?.(event, target);
            if (event.stoppedPropagation) {
                break;
            }
        }

        hovered = nextHovered;
        const cursorTarget = [...nextHovered].find((target) => target.cursor !== undefined);
        if (cursorTarget !== cursorOwner) {
            cursorOwner = cursorTarget;
            setCursor(cursorTarget ? deref(cursorTarget.cursor) : 'auto');
        }
    }, cancellationToken);

    subscribePointerEvent(props.onMouseDown, 'onMouseDown');
    subscribePointerEvent(props.onMouseUp, 'onMouseUp');
    subscribePointerEvent(props.onMouseClick, 'onMouseClick');

    function subscribePointerEvent(
        emitter: EventEmitter<SimplifiedMouseEvent>,
        handler: 'onMouseDown' | 'onMouseUp' | 'onMouseClick'
    ): void {
        emitter.subscribe((event) => {
            for (const target of hitTargets(event)) {
                target[handler]?.(event, target);
                if (event.stoppedPropagation) {
                    return;
                }
            }
        }, cancellationToken);
    }

    function hitTargets(event: SimplifiedMouseEvent): ComponentModel[] {
        const context = props.canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
        return paintOrder.filter((target) => isOnTopOf(event, target, context)).reverse();
    }

    function setCursor(cursor: string): void {
        const canvasWithStyle = props.canvas as OffscreenCanvas & { style?: { cursor: string } };
        if (canvasWithStyle.style) {
            canvasWithStyle.style.cursor = cursor;
        }
    }

    function isOnTopOf(e: SimplifiedMouseEvent, target: ComponentModel, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): boolean {
        if (!target.renderedState) {
            return false;
        }
        const scaleX = props.scale?.value.x ?? 1;
        const scaleY = props.scale?.value.y ?? 1;
        const x = e.offsetX / scaleX - (props.translate?.value.x ?? 0);
        let y = e.offsetY / scaleY - (props.translate?.value.y ?? 0);

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
                    x <= target.renderedState.x + target.renderedState.width &&
                    y <= target.renderedState.y + target.renderedState.height
                );
            case ComponentType.ELIPSE:
            case ComponentType.REGULAR_POLYGON:
                if (!target.renderedState.path) {
                    return false;
                } else {
                    return context.isPointInPath(target.renderedState.path, x, y);
                }
            case ComponentType.LINE:
            case ComponentType.BEZIER_CURVE:
            case ComponentType.QUADRATIC_CURVE:
                const width = context.lineWidth;
                context.lineWidth = target.renderedState.lineWidth;
                try {
                    return context.isPointInStroke(target.renderedState.path, x, y);
                } finally {
                    context.lineWidth = width;
                }
            default:
                if (!target.renderedState.path) {
                    return false;
                } else {
                    return context.isPointInPath(target.renderedState.path, x - target.renderedState.x, y - target.renderedState.y);
                }
        }
    }

    function bind(canvas: OffscreenCanvas | HTMLCanvasElement, children: ComponentModel[], parent: ComponentModel, cancellationToken: CancellationToken): void {
        for (const child of children) {
            if (Array.isArray(child)) {
                bind(canvas, child, parent, cancellationToken);
                continue;
            }
            if (child instanceof ArrayDataSource) {
                child.listen(() => invalidate(canvas), cancellationToken);
                const itemTokens: CancellationToken[] = [];
                cancellationToken.addCancellable(() => itemTokens.forEach((token) => token.cancel()));
                child.listenAndRepeat((change) => {
                    switch (change.operation) {
                        case 'add':
                            for (let itemIndex = 0; itemIndex < change.items.length; itemIndex++) {
                                const itemToken = new CancellationToken();
                                itemTokens.splice(change.index + itemIndex, 0, itemToken);
                                bindDynamicEntity(change.items[itemIndex], parent, itemToken);
                            }
                            break;
                        case 'remove':
                            for (const itemToken of itemTokens.splice(change.index, change.items.length)) {
                                itemToken.cancel();
                            }
                            break;

                        case 'replace':
                            itemTokens[change.index]?.cancel();
                            itemTokens[change.index] = new CancellationToken();
                            bindDynamicEntity(change.items[0], parent, itemTokens[change.index]);
                            break;
                        case 'swap':
                            if (change.index2 !== undefined) {
                                [itemTokens[change.index], itemTokens[change.index2]] = [itemTokens[change.index2], itemTokens[change.index]];
                            }
                            break;
                        case 'merge':
                            for (const itemToken of itemTokens.splice(0)) {
                                itemToken.cancel();
                            }
                            for (const item of change.newState) {
                                const itemToken = new CancellationToken();
                                itemTokens.push(itemToken);
                                bindDynamicEntity(item, parent, itemToken);
                            }
                            break;
                    }
                }, cancellationToken);
                continue;
            }

            if (child instanceof DataSource) {
                child.listen(() => invalidate(canvas), cancellationToken);
                let bindToken: CancellationToken;
                let value: any;
                cancellationToken.addCancellable(() => bindToken?.cancel());
                child.listenAndRepeat((newValue) => {
                    if (value !== newValue) {
                        value = newValue;
                        if (bindToken) {
                            bindToken.cancel();
                        }
                        bindToken = new CancellationToken();
                        bindDynamicEntity(value, parent, bindToken);
                    }
                }, cancellationToken);
                continue;
            }

            if ((child as StateComponentModel)[stateSymbol]) {
                if (!parent) {
                    throw new Error('Cannot use <State> nodes at root level');
                }
                parent.animations.push(child as StateComponentModel);
                continue;
            }
            for (const key in child) {
                const dynamicChild = child as unknown as Record<string, any>;
                if (key === 'readWidth' || key === 'readHeight') {
                    continue;
                }
                if (dynamicChild[key] instanceof DataSource) {
                    let value: any = dynamicChild[key].value;
                    let lastState: any;
                    if (key === 'state') {
                        const value = deref(dynamicChild[key]);
                        lastState = value;
                        child.animationStates = child.animations.filter((e) => e.id === value);
                        child.animationTime = Date.now();
                    }

                    dynamicChild[key].listen((newValue: any) => {
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
            const renderResult: ComponentModel[] = [];
            const lifeCycles: ComponentLifeCycle[] = [];
            for (const piece of arrayedValue) {
                if (!piece) {
                    continue;
                }

                if ((typeof piece !== 'object' && typeof piece !== 'function') || piece === null) {
                    continue;
                }
                if (!renderCache.has(piece)) {
                    const lifeCycle = createLifeCycle();
                    renderCache.set(piece, { rendered: api.prerender(piece, lifeCycle), lifeCycle });
                }
                const cached = renderCache.get(piece)!;
                const rendered = cached.rendered;
                lifeCycles.push(cached.lifeCycle);
                if (Array.isArray(rendered)) {
                    renderResult.push(...(rendered as ComponentModel[]));
                } else if (rendered) {
                    renderResult.push(rendered as ComponentModel);
                }
            }

            bind(canvas, renderResult, parent, bindToken);
            lifeCycles.forEach((lifeCycle) => lifeCycle.onAttach());
            bindToken.addCancellable(() => lifeCycles.forEach((lifeCycle) => lifeCycle.onDetach()));
            invalidate(canvas);
        }

    }

    function invalidate(canvas: HTMLCanvasElement | OffscreenCanvas): void {
        if (pendingRerender === undefined) {
            pendingRerender = requestAnimationFrame(() => {
                pendingRerender = undefined;
                render(canvas, components as any);
            });
        }
    }

    function render(canvas: HTMLCanvasElement | OffscreenCanvas, components: ComponentModel[]): void {
        const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        if (!context) {
            throw new Error('Canvas 2D rendering context is unavailable');
        }
        paintOrder = [];
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

    function unapplyContextTransformation(context: OffscreenCanvasRenderingContext2D) {
        if (props.scale || props.translate) {
            context.restore();
        }
    }

    function applyContextTransformation(context: OffscreenCanvasRenderingContext2D) {
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

    function renderChild(context: OffscreenCanvasRenderingContext2D, child: any, offsetX: number, offsetY: number): void {
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
            child = renderCache.get(child)!.rendered;
        }
        if (child instanceof ArrayDataSource) {
            for (const node of child.getData()) {
                renderChild(context, node, offsetX, offsetY);
            }
            return;
        }

        if (child instanceof DataSource) {
            renderChild(context, child.value, offsetX, offsetY);
            return;
        }

        context.save();
        let idle = true;
        if (child.colorBlending !== undefined) {
            context.globalCompositeOperation = deref(child.colorBlending);
        }
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
            case ComponentType.IMAGE:
                idle = renderImage(context, child as ImageComponentModel, offsetX, offsetY, requestRender);
                break;
            case ComponentType.LARGE_CONTENT_BOX:
                idle = renderLargeContentBox(context, child as LargeContentBoxModel, offsetX, offsetY);
                break;
            case ComponentType.GROUP:
                idle = true;
                break;
            default:
                idle = true;
                break;
        }
        paintOrder.push(child);
        if (!idle) {
            invalidate(context.canvas);
        }

        for (const subChild of child.children ?? []) {
            renderChild(context, subChild, deref(child.x) + offsetX, deref(child.y) + offsetY);
        }
        context.restore();
    }
}
