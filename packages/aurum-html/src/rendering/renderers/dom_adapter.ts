import { handleClass, handleStyle } from '../../nodes/rendering_helpers.js';
import { AurumComponentAPI, AurumElement, createRenderSession, Renderable, Rendered, renderInternal } from '@aurum/rendering';
import { DataSource } from '@aurum/streams';
import { dsUnique } from '@aurum/streams';
import { CancellationToken } from '@aurum/streams';
import { AttributeValue, Callback, ClassType, DataDrain, MapLike, StyleType, writeTo } from '@aurum/streams';
import { AurumDecorator } from '../../utilities/aurum.js';

export interface HTMLNodeProps<T> {
    decorate?: AurumDecorator | AurumDecorator[];
    id?: AttributeValue;
    name?: AttributeValue;
    draggable?: AttributeValue;
    class?: ClassType;
    tabIndex?: AttributeValue;
    style?: StyleType;
    title?: AttributeValue;
    role?: AttributeValue;
    slot?: AttributeValue;
    contenteditable?: AttributeValue;

    ariaAtomic?: AttributeValue;
    ariaAutoComplete?: AttributeValue;
    ariaBrailleLabel?: AttributeValue;
    ariaBrailleRoleDescription?: AttributeValue;
    ariaBusy?: AttributeValue;
    ariaChecked?: AttributeValue;
    ariaColCount?: AttributeValue;
    ariaColIndex?: AttributeValue;
    ariaColIndexText?: AttributeValue;
    ariaColSpan?: AttributeValue;
    ariaControlsElements?: AttributeValue;
    ariaCurrent?: AttributeValue;
    ariaDescribedByElements?: AttributeValue;
    ariaDescription?: AttributeValue;
    ariaDetailsElements?: AttributeValue;
    ariaDisabled?: AttributeValue;
    ariaErrorMessageElements?: AttributeValue;
    ariaExpanded?: AttributeValue;
    ariaFlowToElements?: AttributeValue;
    ariaHasPopup?: AttributeValue;
    ariaHidden?: AttributeValue;
    ariaInvalid?: AttributeValue;
    ariaKeyShortcuts?: AttributeValue;
    ariaLabel?: AttributeValue;
    ariaLabelledByElements?: AttributeValue;
    ariaLevel?: AttributeValue;
    ariaLive?: AttributeValue;
    ariaModal?: AttributeValue;
    ariaMultiLine?: AttributeValue;
    ariaMultiSelectable?: AttributeValue;
    ariaOrientation?: AttributeValue;
    ariaOwnsElements?: AttributeValue;
    ariaPlaceholder?: AttributeValue;
    ariaPosInSet?: AttributeValue;
    ariaPressed?: AttributeValue;
    ariaReadOnly?: AttributeValue;
    ariaRelevant?: AttributeValue;
    ariaRequired?: AttributeValue;
    ariaRoleDescription?: AttributeValue;
    ariaRowCount?: AttributeValue;
    ariaRowIndex?: AttributeValue;
    ariaRowIndexText?: AttributeValue;
    ariaRowSpan?: AttributeValue;
    ariaSelected?: AttributeValue;
    ariaSetSize?: AttributeValue;
    ariaSort?: AttributeValue;
    ariaValueMax?: AttributeValue;
    ariaValueMin?: AttributeValue;
    ariaValueNow?: AttributeValue;
    ariaValueText?: AttributeValue;

    onContextMenu?: DataDrain<MouseEvent>;
    onDblClick?: DataDrain<MouseEvent>;
    onClick?: DataDrain<MouseEvent>;
    onKeyDown?: DataDrain<KeyboardEvent>;
    onKeyUp?: DataDrain<KeyboardEvent>;
    onKeyPress?: DataDrain<KeyboardEvent>;
    onMouseDown?: DataDrain<MouseEvent>;
    onMouseUp?: DataDrain<MouseEvent>;
    onMouseEnter?: DataDrain<MouseEvent>;
    onMouseLeave?: DataDrain<MouseEvent>;
    onMouseMove?: DataDrain<MouseEvent>;
    onMouseWheel?: DataDrain<WheelEvent>;
    onBlur?: DataDrain<FocusEvent>;
    onFocus?: DataDrain<FocusEvent>;
    onDrag?: DataDrain<DragEvent>;
    onDragEnd?: DataDrain<DragEvent>;
    onDragEnter?: DataDrain<DragEvent>;
    onDragExit?: DataDrain<DragEvent>;
    onDragLeave?: DataDrain<DragEvent>;
    onDragOver?: DataDrain<DragEvent>;
    onDragStart?: DataDrain<DragEvent>;
    onDrop?: DataDrain<DragEvent>;
    onLoad?: DataDrain<Event>;
    onError?: DataDrain<ErrorEvent>;
    onTransitionEnd?: DataDrain<TransitionEvent>;
    onTransitionStart?: DataDrain<TransitionEvent>;
    onTransitionRun?: DataDrain<TransitionEvent>;
    onTransitionCancel?: DataDrain<TransitionEvent>;
    onAnimationEnd?: DataDrain<AnimationEvent>;
    onAnimationStart?: DataDrain<AnimationEvent>;
    onAnimationIteration?: DataDrain<AnimationEvent>;
    onAnimationCancel?: DataDrain<AnimationEvent>;
    onAuxClick?: DataDrain<PointerEvent>;
    onBeforeInput?: DataDrain<InputEvent>;
    onBeforeMatch?: DataDrain<Event>;
    onCompositionEnd?: DataDrain<CompositionEvent>;
    onCompositionStart?: DataDrain<CompositionEvent>;
    onCompositionUpdate?: DataDrain<CompositionEvent>;
    onContentVisibilityAutoStateChange?: DataDrain<Event>;
    onCopy?: DataDrain<ClipboardEvent>;
    onCut?: DataDrain<ClipboardEvent>;
    onPaste?: DataDrain<ClipboardEvent>;
    onFocusIn?: DataDrain<FocusEvent>;
    onFocusOut?: DataDrain<FocusEvent>;
    onFullscreenChange?: DataDrain<Event>;
    onFullscreenError?: DataDrain<ErrorEvent>;
    onGotPointerCapture?: DataDrain<PointerEvent>;
    onLostPointerCapture?: DataDrain<PointerEvent>;
    onPointerCancel?: DataDrain<PointerEvent>;
    onPointerDown?: DataDrain<PointerEvent>;
    onPointerEnter?: DataDrain<PointerEvent>;
    onPointerLeave?: DataDrain<PointerEvent>;
    onPointerMove?: DataDrain<PointerEvent>;
    onPointerOut?: DataDrain<PointerEvent>;
    onPointerOver?: DataDrain<PointerEvent>;
    onPointerUp?: DataDrain<PointerEvent>;
    onScroll?: DataDrain<UIEvent>;
    onScrollEnd?: DataDrain<UIEvent>;
    onSecurityPolicyViolation?: DataDrain<SecurityPolicyViolationEvent>;
    onTouchCancel?: DataDrain<TouchEvent>;
    onTouchEnd?: DataDrain<TouchEvent>;
    onTouchMove?: DataDrain<TouchEvent>;
    onTouchStart?: DataDrain<TouchEvent>;
    onAttach?: Callback<T>;
    onDetach?: Callback<T>;
}

/**
 * @internal
 */
export const defaultEvents: MapLike<string> = {
    drag: 'onDrag',
    dragstart: 'onDragStart',
    dragend: 'onDragEnd',
    dragexit: 'onDragExit',
    dragover: 'onDragOver',
    dragenter: 'onDragEnter',
    dragleave: 'onDragLeave',
    drop: 'onDrop',
    blur: 'onBlur',
    focus: 'onFocus',
    click: 'onClick',
    dblclick: 'onDblClick',
    keydown: 'onKeyDown',
    keyPress: 'onKeyPress',
    keyup: 'onKeyUp',
    contextmenu: 'onContextMenu',
    mousedown: 'onMouseDown',
    mouseup: 'onMouseUp',
    mousemove: 'onMouseMove',
    mouseenter: 'onMouseEnter',
    mouseleave: 'onMouseLeave',
    mousewheel: 'onMouseWheel',
    load: 'onLoad',
    error: 'onError',
    transitionend: 'onTransitionEnd',
    transitionstart: 'onTransitionStart',
    transitionrun: 'onTransitionRun',
    transitioncancel: 'onTransitionCancel',
    animationend: 'onAnimationEnd',
    animationstart: 'onAnimationStart',
    animationiteration: 'onAnimationIteration',
    animationcancel: 'onAnimationCancel',
    auxclick: 'onAuxClick',
    beforeinput: 'onBeforeInput',
    beforematch: 'onBeforeMatch',
    compositionend: 'onCompositionEnd',
    compositionstart: 'onCompositionStart',
    compositionupdate: 'onCompositionUpdate',
    contentvisibilityautostatechange: 'onContentVisibilityAutoStateChange',
    copy: 'onCopy',
    cut: 'onCut',
    paste: 'onPaste',
    focusin: 'onFocusIn',
    focusout: 'onFocusOut',
    fullscreenchange: 'onFullscreenChange',
    fullscreenerror: 'onFullscreenError',
    gotpointercapture: 'onGotPointerCapture',
    lostpointercapture: 'onLostPointerCapture',
    pointercancel: 'onPointerCancel',
    pointerdown: 'onPointerDown',
    pointerenter: 'onPointerEnter',
    pointerleave: 'onPointerLeave',
    pointermove: 'onPointerMove',
    pointerout: 'onPointerOut',
    pointerover: 'onPointerOver',
    pointerup: 'onPointerUp',
    scroll: 'onScroll',
    scrollend: 'onScrollEnd',
    securitypolicyviolation: 'onSecurityPolicyViolation',
    touchcancel: 'onTouchCancel',
    touchend: 'onTouchEnd',
    touchmove: 'onTouchMove',
    touchstart: 'onTouchStart',
    attach: 'onAttach',
    detach: 'onDetach'
};

/**
 * @internal
 */
export const defaultAttributes: string[] = [
    'id',
    'name',
    'draggable',
    'tabIndex',
    'role',
    'contenteditable',
    'slot',
    'title',
    'ariaAtomic',
    'ariaAutoComplete',
    'ariaBrailleLabel',
    'ariaBrailleRoleDescription',
    'ariaBusy',
    'ariaChecked',
    'ariaColCount',
    'ariaColIndex',
    'ariaColIndexText',
    'ariaColSpan',
    'ariaControlsElements',
    'ariaCurrent',
    'ariaDescribedByElements',
    'ariaDescription',
    'ariaDetailsElements',
    'ariaDisabled',
    'ariaErrorMessageElements',
    'ariaExpanded',
    'ariaFlowToElements',
    'ariaHasPopup',
    'ariaHidden',
    'ariaInvalid',
    'ariaKeyShortcuts',
    'ariaLabel',
    'ariaLabelledByElements',
    'ariaLevel',
    'ariaLive',
    'ariaModal',
    'ariaMultiLine',
    'ariaMultiSelectable',
    'ariaOrientation',
    'ariaOwnsElements',
    'ariaPlaceholder',
    'ariaPosInSet',
    'ariaPressed',
    'ariaReadOnly',
    'ariaRelevant',
    'ariaRequired',
    'ariaRoleDescription',
    'ariaRowCount',
    'ariaRowIndex',
    'ariaRowIndexText',
    'ariaRowSpan',
    'ariaSelected',
    'ariaSetSize',
    'ariaSort',
    'ariaValueMax',
    'ariaValueMin',
    'ariaValueNow',
    'ariaValueText'
];

export function DomNodeCreator<T extends HTMLNodeProps<any>>(
    nodeName: string,
    extraAttributes?: string[],
    extraEvents?: MapLike<string>,
    extraLogic?: (node: HTMLElement, props: T, cleanUp: CancellationToken) => void,
    svg: boolean = false
) {
    return function (props: T, children: Renderable[], api: AurumComponentAPI): HTMLElement {
        let node: HTMLElement;
        if (svg) {
            node = document.createElementNS('http://www.w3.org/2000/svg', nodeName) as unknown as HTMLElement;
        } else {
            node = document.createElement(nodeName);
        }
        if (props) {
            processHTMLNode(node, props, api.cancellationToken, extraAttributes, extraEvents);
        }
        //@ts-ignore
        const renderedChildren = renderInternal(children, api.renderSession);
        connectChildren(node, renderedChildren);
        if (props) {
            if (props.onAttach) {
                api.onAttach(() => props.onAttach(node));
            }
            if (props.onDetach) {
                api.onDetach(() => {
                    if (node.isConnected) {
                        node.parentElement.removeChild(node);
                    }
                    props.onDetach(node);
                });
            }
        }

        extraLogic?.(node, props, api.cancellationToken);

        return node;
    };
}

function connectChildren(target: HTMLElement, children: Rendered[]): void {
    if (children === undefined || children === null || children.length === 0) {
        return;
    }

    for (const child of children) {
        if (!child) {
            continue;
        }
        if (child instanceof Text || child instanceof HTMLElement || child instanceof SVGElement) {
            target.appendChild(child);
        } else if (child instanceof AurumElement) {
            child.attachToDom(target, target.childNodes.length);
        } else {
            if (typeof child === 'function') {
                throw new Error(
                    `Unexpected child type passed to DOM Node: function. Did you mean to use a component? To use a component use JSX syntax such as <MyComponent/> it works even with function references. <props.myReference/>`
                );
            }

            throw new Error(
                `Unexpected child type passed to DOM Node: ${children}. If this is a valid child type make sure you don't have 2 copies of Aurum loaded`
            );
        }
    }
}

export function processHTMLNode(
    node: HTMLElement,
    props: HTMLNodeProps<any>,
    cleanUp: CancellationToken,
    extraAttributes?: string[],
    extraEvents?: MapLike<string>
) {
    createEventHandlers(node, defaultEvents, props);
    if (extraEvents) {
        createEventHandlers(node, extraEvents, props);
    }

    const dataProps = Object.keys(props).filter((e) => e.includes('-'));
    bindProps(node, defaultAttributes, props, cleanUp, dataProps);
    if (extraAttributes) {
        bindProps(node, extraAttributes, props, cleanUp);
    }

    if (props.style) {
        const result = handleStyle(props.style, cleanUp);
        if (result instanceof DataSource) {
            result.listenAndRepeat((v) => {
                node.setAttribute('style', v);
            }, cleanUp);
        } else {
            node.setAttribute('style', result);
        }
    }

    if (props.class) {
        const result = handleClass(props.class, cleanUp);
        if (result instanceof DataSource) {
            result.listenAndRepeat((v) => {
                node.className = v;
            }, cleanUp);
        } else {
            node.className = result;
        }
    }
}

export function createEventHandlers(node: HTMLElement, events: MapLike<string>, props: any) {
    for (const key in events) {
        if (props[events[key]]) {
            //@ts-ignore
            node.addEventListener(key, (e: MouseEvent) => writeTo(props[events[key]], e));
        }
    }
}

function bindProps(node: HTMLElement, keys: string[], props: any, cleanUp: CancellationToken, dynamicProps?: string[]) {
    for (const key of keys) {
        if (props[key] != undefined) {
            assignStringSourceToAttribute(node, props[key], key, cleanUp);
        }
    }
    if (dynamicProps) {
        for (const key of dynamicProps) {
            if (props[key] != undefined) {
                assignStringSourceToAttribute(node, props[key], key, cleanUp);
            }
        }
    }
}

/**
 * Renders Aurum content synchronously in line. In case no lifecycle sync object is provided you have to manually call fireOnAttach and dispose at the appropriate times to ensure proper lifecycle handling such as attach and detach events
 * @param content Content to render
 * @param syncLifecycle Optional lifecycle sync object. If provided the lifecycle of the rendered content will be synchronized with the provided lifecycle (meaning attach and detach events will be fired when the lifecycle fires them)
 */
export function aurumToHTML(content: Renderable, syncLifecycle?: AurumComponentAPI): { content: HTMLElement; fireOnAttach(): void; dispose(): void } {
    const rs = createRenderSession();
    const renderedContent = renderInternal(content, rs);

    if (syncLifecycle) {
        syncLifecycle.onAttach(() => rs.attachCalls.forEach((c) => c()));
        syncLifecycle.onDetach(() => rs.sessionToken.cancel());
    }

    return {
        content: renderedContent,
        fireOnAttach: () => rs.attachCalls.forEach((c) => c()),
        dispose: () => rs.sessionToken.cancel()
    };
}

function assignStringSourceToAttribute(node: HTMLElement, data: AttributeValue, key: string, cleanUp: CancellationToken) {
    if (typeof data === 'string' || typeof data === 'number') {
        node.setAttribute(key, data.toString());
    } else if (typeof data === 'boolean') {
        if (data) {
            node.setAttribute(key, '');
        }
    } else if (data instanceof DataSource) {
        if (typeof data.value === 'string' || typeof data.value === 'number') {
            node.setAttribute(key, data.value.toString());
        } else if (typeof data.value === 'boolean') {
            if (data.value) {
                node.setAttribute(key, '');
            }
        }
        data.transform(dsUnique(), cleanUp).listen((v) => {
            if (typeof v === 'string' || typeof v === 'number') {
                node.setAttribute(key, v.toString());
            } else if (typeof v === 'boolean') {
                if (v) {
                    node.setAttribute(key, '');
                } else {
                    node.removeAttribute(key);
                }
            }
        });
    } else {
        throw new Error('Attributes only support types boolean, string, number and data sources');
    }
}
