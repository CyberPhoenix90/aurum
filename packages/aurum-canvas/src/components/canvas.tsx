import {
    Aurum,
    AurumComponentAPI,
    AurumElement,
    ClassType,
    DataSource,
    EventEmitter,
    ReadOnlyDataSource,
    Renderable,
    StyleType,
    createLifeCycle,
    dsMap,
    dsUnique
} from 'aurumjs';
import { AurumnCanvasFeatures } from './canvas_feature_model.js';
import { SimplifiedKeyboardEvent, SimplifiedMouseEvent, SimplifiedWheelEvent } from './common_props.js';
import { AurumOffscreenCanvas } from './offscreen_canvas.js';

export interface AurumCanvasProps {
    backgroundColor?: DataSource<string> | string;
    onAttach?(canvas: HTMLCanvasElement): void;
    onDetach?(): void;
    class?: ClassType;
    style?: StyleType;
    onMouseMove?(e: MouseEvent): void;
    onMouseDown?(e: MouseEvent): void;
    onMouseUp?(e: MouseEvent): void;
    onMouseClick?(e: MouseEvent): void;
    onKeyDown?(e: KeyboardEvent): void;
    onKeyUp?(e: KeyboardEvent): void;
    onWheel?(e: WheelEvent): void;

    /**
     * Optional manual horizontal resoltution. If omitted the canvas will automatically sync its resolution to the css size
     */
    width?: ReadOnlyDataSource<string | number> | ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | string | number;
    /**
     * Optional manual vertical resoltution. If omitted the canvas will automatically sync its resolution to the css size
     */
    height?: ReadOnlyDataSource<string | number> | ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | string | number;
    translate?: DataSource<{ x: number; y: number }>;
    scale?: DataSource<{ x: number; y: number }>;
    features?: AurumnCanvasFeatures;
    /**
     * In case of auto size this will update to the current width of the canvas
     */
    readWidth?: DataSource<number>;
    /**
     * In case of auto size this will update to the current height of the canvas
     */
    readHeight?: DataSource<number>;
}

export function AurumCanvas(props: AurumCanvasProps, children: Renderable[], api: AurumComponentAPI): AurumElement {
    const lc = createLifeCycle();
    api.synchronizeLifeCycle(lc);
    const onMouseMove: EventEmitter<SimplifiedMouseEvent> = new EventEmitter();
    const onMouseUp: EventEmitter<SimplifiedMouseEvent> = new EventEmitter();
    const onMouseDown: EventEmitter<SimplifiedMouseEvent> = new EventEmitter();
    const onMouseClick: EventEmitter<SimplifiedMouseEvent> = new EventEmitter();
    const onKeyDown: EventEmitter<SimplifiedKeyboardEvent> = new EventEmitter();
    const onKeyUp: EventEmitter<SimplifiedKeyboardEvent> = new EventEmitter();
    const onWheel: EventEmitter<SimplifiedWheelEvent> = new EventEmitter();
    const invalidate = new EventEmitter<void>();

    return (
        <canvas
            draggable={false}
            onAttach={(canvas) => {
                // Auto sync resolution to css size
                if (!props.width || props.height) {
                    const handleResize = () => {
                        let dirty = false;
                        if (!props.width) {
                            if (canvas.width !== canvas.clientWidth) {
                                canvas.width = canvas.clientWidth;
                                props.readWidth?.update(canvas.clientWidth);
                                dirty = true;
                            }
                        }
                        if (!props.height) {
                            if (canvas.height !== canvas.clientHeight) {
                                canvas.height = canvas.clientHeight;
                                props.readHeight?.update(canvas.clientHeight);
                                dirty = true;
                            }
                        }

                        if (dirty) {
                            invalidate.fire();
                        }
                    };
                    const rso = new ResizeObserver(handleResize);

                    rso.observe(canvas);
                    handleResize();
                    api.cancellationToken.addCancellable(() => rso.disconnect());
                }

                if (props.width instanceof DataSource) {
                    props.width.listen(() => {
                        invalidate.fire();
                    }, api.cancellationToken);
                }

                if (props.backgroundColor instanceof DataSource) {
                    props.backgroundColor.listen(() => {
                        invalidate.fire();
                    }, api.cancellationToken);
                }

                if (props.height instanceof DataSource) {
                    props.height.listen(() => {
                        invalidate.fire();
                    }, api.cancellationToken);
                }

                bindCanvas(canvas);
                if (props.translate) {
                    props.translate.transform(dsUnique(), api.cancellationToken).listen((v) => {
                        invalidate.fire();
                    });
                }
                if (props.scale) {
                    props.scale.transform(dsUnique(), api.cancellationToken).listen((v) => {
                        invalidate.fire();
                    });
                }
                props.onAttach?.(canvas);
            }}
            onDetach={() => {
                props.onDetach?.();
            }}
            style={props.style}
            class={props.class}
            width={
                typeof props.width !== 'object'
                    ? props.width?.toString()
                    : (props.width.transform(dsMap<string | number, string>((v) => v.toString())) as DataSource<string>)
            }
            height={
                typeof props.height !== 'object'
                    ? props.height?.toString()
                    : (props.height.transform(dsMap<string | number, string>((v) => v.toString())) as DataSource<string>)
            }
        ></canvas>
    );

    function bindCanvas(canvas: HTMLCanvasElement) {
        api.cancellationToken.registerDomEvent(canvas, 'mouseleave', (e: MouseEvent) => {
            const virtualEvent = {
                button: e.button,
                clientX: e.clientX,
                clientY: e.clientY,
                offsetX: e.offsetX,
                offsetY: e.offsetY,
                stoppedPropagation: false,
                stopPropagation: () => {
                    e.stopPropagation();
                    virtualEvent.stoppedPropagation = true;
                }
            };
            onMouseMove.fire(virtualEvent);
            if (!virtualEvent.stoppedPropagation) {
                props.onMouseMove?.(e);
            }
        });

        api.cancellationToken.registerDomEvent(canvas, 'mousemove', (e: MouseEvent) => {
            const virtualEvent = {
                button: e.button,
                clientX: e.clientX,
                clientY: e.clientY,
                offsetX: e.offsetX,
                offsetY: e.offsetY,
                stoppedPropagation: false,
                stopPropagation: () => {
                    e.stopPropagation();
                    virtualEvent.stoppedPropagation = true;
                }
            };
            onMouseMove.fire(virtualEvent);
            if (!virtualEvent.stoppedPropagation) {
                props.onMouseMove?.(e);
            }
        });

        api.cancellationToken.registerDomEvent(canvas, 'mousedown', (e: MouseEvent) => {
            const virtualEvent = {
                button: e.button,
                clientX: e.clientX,
                clientY: e.clientY,
                offsetX: e.offsetX,
                offsetY: e.offsetY,
                stoppedPropagation: false,
                stopPropagation: () => {
                    e.stopPropagation();
                    virtualEvent.stoppedPropagation = true;
                }
            };
            onMouseDown.fire(virtualEvent);
            if (!virtualEvent.stoppedPropagation) {
                props.onMouseDown?.(e);
            }
        });
        api.cancellationToken.registerDomEvent(canvas, 'mouseup', (e: MouseEvent) => {
            const virtualEvent = {
                button: e.button,
                clientX: e.clientX,
                clientY: e.clientY,
                offsetX: e.offsetX,
                offsetY: e.offsetY,
                stoppedPropagation: false,
                stopPropagation: () => {
                    e.stopPropagation();
                    virtualEvent.stoppedPropagation = true;
                }
            };
            onMouseUp.fire(virtualEvent);
            if (!virtualEvent.stoppedPropagation) {
                props.onMouseUp?.(e);
            }
        });
        api.cancellationToken.registerDomEvent(canvas, 'click', (e: MouseEvent) => {
            const virtualEvent = {
                button: e.button,
                clientX: e.clientX,
                clientY: e.clientY,
                offsetX: e.offsetX,
                offsetY: e.offsetY,
                stoppedPropagation: false,
                stopPropagation: () => {
                    e.stopPropagation();
                    virtualEvent.stoppedPropagation = true;
                }
            };
            onMouseClick.fire(virtualEvent);
            if (!virtualEvent.stoppedPropagation) {
                props.onMouseClick?.(e);
            }
        });
        api.cancellationToken.registerDomEvent(window, 'keydown', (e: KeyboardEvent) => {
            const virtualEvent = {
                key: e.key,
                keyCode: e.keyCode,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey,
                stoppedPropagation: false,
                stopPropagation: () => {
                    e.stopPropagation();
                    virtualEvent.stoppedPropagation = true;
                }
            };

            onKeyDown.fire(virtualEvent);
            if (!virtualEvent.stoppedPropagation) {
                props.onKeyDown?.(e);
            }
        });
        api.cancellationToken.registerDomEvent(window, 'keyup', (e: KeyboardEvent) => {
            const virtualEvent = {
                key: e.key,
                keyCode: e.keyCode,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey,
                stoppedPropagation: false,
                stopPropagation: () => {
                    e.stopPropagation();
                    virtualEvent.stoppedPropagation = true;
                }
            };

            onKeyUp.fire(virtualEvent);
            if (!virtualEvent.stoppedPropagation) {
                props.onKeyUp?.(e);
            }
        });
        api.cancellationToken.registerDomEvent(canvas, 'wheel', (e: WheelEvent) => {
            const virtualEvent = {
                button: e.button,
                clientX: e.clientX,
                clientY: e.clientY,
                offsetX: e.offsetX,
                offsetY: e.offsetY,
                deltaY: e.deltaY,
                stoppedPropagation: false,
                stopPropagation: () => {
                    e.stopPropagation();
                    virtualEvent.stoppedPropagation = true;
                }
            };
            onWheel.fire(virtualEvent);
            if (!virtualEvent.stoppedPropagation) {
                props.onWheel?.(e);
            }
        });

        AurumOffscreenCanvas(
            {
                canvas: canvas,
                onMouseMove,
                onMouseDown,
                onMouseUp,
                onKeyDown,
                onMouseClick,
                onKeyUp,
                onWheel,
                translate: props.translate,
                scale: props.scale,
                features: props.features,
                invalidate
            },
            children,
            api
        );
    }
}
