import { handleClass, handleStyle } from '../../nodes/rendering_helpers.js';
import {
    AurumComponentAPI,
    createRenderSession,
    linkAurumDomNodeChildren,
    registerAurumDomNode,
    registerAurumRenderBinding,
    Renderable,
    RenderSession
} from '@aurum/rendering';
import { AurumElement, Rendered, renderInternal } from '../dom_runtime.js';
import { AURUM_DEVTOOLS_DEBUG_BUILD_ENABLED, DataSource } from '@aurum/streams';
import { CancellationToken } from '@aurum/streams';
import { AttributeValue, ClassType, DataDrain, MapLike, StyleType, writeTo } from '@aurum/streams';
import { AurumDecorator } from '../../utilities/aurum.js';
import { queueRenderUpdate, renderBatchState } from '../render_batch.js';

/** A DOM event contextualized with the element whose Aurum handler receives it. */
export type DOMEvent<E extends Event, T> = E & {
    readonly currentTarget: T;
    readonly target: EventTarget & T;
};

export interface HTMLNodeProps<T> {
    /** Present for the automatic JSX runtime; Aurum still supplies children as the component's second argument. */
    children?: Renderable | Renderable[];
    /** Automatic JSX uses this for identity; it is non-enumerable at runtime. */
    key?: string | number;
    decorate?: AurumDecorator | AurumDecorator[];
    id?: AttributeValue;
    name?: AttributeValue;
    draggable?: AttributeValue;
    class?: ClassType;
    tabIndex?: AttributeValue;
    tabindex?: AttributeValue;
    style?: StyleType;
    title?: AttributeValue;
    role?: AttributeValue;
    slot?: AttributeValue;
    contenteditable?: AttributeValue;
    contentEditable?: AttributeValue;
    accesskey?: AttributeValue;
    accessKey?: AttributeValue;
    autocapitalize?: AttributeValue;
    autofocus?: AttributeValue;
    autoFocus?: AttributeValue;
    dir?: AttributeValue;
    enterkeyhint?: AttributeValue;
    hidden?: AttributeValue;
    open?: AttributeValue;
    dangerouslySetInnerHTML?: { __html: string };
    inert?: AttributeValue;
    inputmode?: AttributeValue;
    is?: AttributeValue;
    itemid?: AttributeValue;
    itemprop?: AttributeValue;
    itemref?: AttributeValue;
    itemscope?: AttributeValue;
    itemtype?: AttributeValue;
    lang?: AttributeValue;
    nonce?: AttributeValue;
    part?: AttributeValue;
    popover?: AttributeValue;
    spellcheck?: AttributeValue;
    spellCheck?: AttributeValue;
    translate?: AttributeValue;

    [dataAttribute: `data-${string}`]: AttributeValue | undefined;
    [ariaAttribute: `aria-${string}`]: AttributeValue | undefined;

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

    onContextMenu?: DataDrain<DOMEvent<MouseEvent, T>>;
    onDblClick?: DataDrain<DOMEvent<MouseEvent, T>>;
    onDoubleClick?: DataDrain<DOMEvent<MouseEvent, T>>;
    onClick?: DataDrain<DOMEvent<MouseEvent, T>>;
    onKeyDown?: DataDrain<DOMEvent<KeyboardEvent, T>>;
    onKeyUp?: DataDrain<DOMEvent<KeyboardEvent, T>>;
    onKeyPress?: DataDrain<DOMEvent<KeyboardEvent, T>>;
    onMouseDown?: DataDrain<DOMEvent<MouseEvent, T>>;
    onMouseUp?: DataDrain<DOMEvent<MouseEvent, T>>;
    onMouseEnter?: DataDrain<DOMEvent<MouseEvent, T>>;
    onMouseLeave?: DataDrain<DOMEvent<MouseEvent, T>>;
    onMouseMove?: DataDrain<DOMEvent<MouseEvent, T>>;
    onMouseWheel?: DataDrain<DOMEvent<WheelEvent, T>>;
    onWheel?: DataDrain<DOMEvent<WheelEvent, T>>;
    onBlur?: DataDrain<DOMEvent<FocusEvent, T>>;
    onFocus?: DataDrain<DOMEvent<FocusEvent, T>>;
    onDrag?: DataDrain<DOMEvent<DragEvent, T>>;
    onDragEnd?: DataDrain<DOMEvent<DragEvent, T>>;
    onDragEnter?: DataDrain<DOMEvent<DragEvent, T>>;
    onDragExit?: DataDrain<DOMEvent<DragEvent, T>>;
    onDragLeave?: DataDrain<DOMEvent<DragEvent, T>>;
    onDragOver?: DataDrain<DOMEvent<DragEvent, T>>;
    onDragStart?: DataDrain<DOMEvent<DragEvent, T>>;
    onDrop?: DataDrain<DOMEvent<DragEvent, T>>;
    onLoad?: DataDrain<Event>;
    onError?: DataDrain<DOMEvent<ErrorEvent, T>>;
    onTransitionEnd?: DataDrain<DOMEvent<TransitionEvent, T>>;
    onTransitionStart?: DataDrain<DOMEvent<TransitionEvent, T>>;
    onTransitionRun?: DataDrain<DOMEvent<TransitionEvent, T>>;
    onTransitionCancel?: DataDrain<DOMEvent<TransitionEvent, T>>;
    onAnimationEnd?: DataDrain<DOMEvent<AnimationEvent, T>>;
    onAnimationStart?: DataDrain<DOMEvent<AnimationEvent, T>>;
    onAnimationIteration?: DataDrain<DOMEvent<AnimationEvent, T>>;
    onAnimationCancel?: DataDrain<DOMEvent<AnimationEvent, T>>;
    onAuxClick?: DataDrain<DOMEvent<PointerEvent, T>>;
    onBeforeInput?: DataDrain<DOMEvent<InputEvent, T>>;
    onBeforeMatch?: DataDrain<Event>;
    onCompositionEnd?: DataDrain<DOMEvent<CompositionEvent, T>>;
    onCompositionStart?: DataDrain<DOMEvent<CompositionEvent, T>>;
    onCompositionUpdate?: DataDrain<DOMEvent<CompositionEvent, T>>;
    onContentVisibilityAutoStateChange?: DataDrain<Event>;
    onCopy?: DataDrain<DOMEvent<ClipboardEvent, T>>;
    onCut?: DataDrain<DOMEvent<ClipboardEvent, T>>;
    onPaste?: DataDrain<DOMEvent<ClipboardEvent, T>>;
    onFocusIn?: DataDrain<DOMEvent<FocusEvent, T>>;
    onFocusOut?: DataDrain<DOMEvent<FocusEvent, T>>;
    onFullscreenChange?: DataDrain<Event>;
    onFullscreenError?: DataDrain<DOMEvent<ErrorEvent, T>>;
    onGotPointerCapture?: DataDrain<DOMEvent<PointerEvent, T>>;
    onLostPointerCapture?: DataDrain<DOMEvent<PointerEvent, T>>;
    onPointerCancel?: DataDrain<DOMEvent<PointerEvent, T>>;
    onPointerDown?: DataDrain<DOMEvent<PointerEvent, T>>;
    onPointerEnter?: DataDrain<DOMEvent<PointerEvent, T>>;
    onPointerLeave?: DataDrain<DOMEvent<PointerEvent, T>>;
    onPointerMove?: DataDrain<DOMEvent<PointerEvent, T>>;
    onPointerOut?: DataDrain<DOMEvent<PointerEvent, T>>;
    onPointerOver?: DataDrain<DOMEvent<PointerEvent, T>>;
    onPointerUp?: DataDrain<DOMEvent<PointerEvent, T>>;
    onScroll?: DataDrain<DOMEvent<UIEvent, T>>;
    onScrollEnd?: DataDrain<DOMEvent<UIEvent, T>>;
    onSecurityPolicyViolation?: DataDrain<DOMEvent<SecurityPolicyViolationEvent, T>>;
    onTouchCancel?: DataDrain<DOMEvent<TouchEvent, T>>;
    onTouchEnd?: DataDrain<DOMEvent<TouchEvent, T>>;
    onTouchMove?: DataDrain<DOMEvent<TouchEvent, T>>;
    onTouchStart?: DataDrain<DOMEvent<TouchEvent, T>>;
    onAttach?: (element: T) => void;
    onDetach?: (element: T) => void;
}

export type GenericHTMLNodeProps<T extends HTMLElement = HTMLElement> = HTMLNodeProps<T>;

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
    // Standard DOM-style aliases retained alongside Aurum's historical names.
    doubleclick: 'onDoubleClick',
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
    wheel: 'onWheel',
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
    'accesskey',
    'autocapitalize',
    'autofocus',
    'dir',
    'enterkeyhint',
    'hidden',
    'inert',
    'inputmode',
    'is',
    'itemid',
    'itemprop',
    'itemref',
    'itemscope',
    'itemtype',
    'lang',
    'nonce',
    'part',
    'popover',
    'spellcheck',
    'translate',
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
    svg: boolean = false,
    bindAllValidAttributes: boolean = false
) {
    const acceptedAttributes = new Set([...defaultAttributes, ...(extraAttributes ?? [])].map(normalizeAttributeName));
    const eventByProp = createEventMap(extraEvents);
    return function (props: T, children: Renderable[], api: AurumComponentAPI): HTMLElement {
        let node: HTMLElement;
        if (svg) {
            node = document.createElementNS('http://www.w3.org/2000/svg', nodeName) as unknown as HTMLElement;
        } else {
            node = document.createElement(nodeName);
        }
        if (AURUM_DEVTOOLS_DEBUG_BUILD_ENABLED) registerAurumDomNode(node, api.cancellationToken, api.renderSession);
        if (props) {
            processHTMLNodeInternal(
                node,
                props,
                () => api.cancellationToken,
                acceptedAttributes,
                eventByProp,
                api.renderSession,
                bindAllValidAttributes
            );
        }
        //@ts-ignore
        const renderedChildren = renderInternal(children, api.renderSession);
        const childNodes = Array.isArray(renderedChildren) ? renderedChildren : renderedChildren ? [renderedChildren] : [];
        connectChildren(node, childNodes);
        if (AURUM_DEVTOOLS_DEBUG_BUILD_ENABLED) {
            linkAurumDomNodeChildren(
                node,
                childNodes.filter((child): child is HTMLElement | SVGElement => child instanceof HTMLElement || child instanceof SVGElement),
                api.cancellationToken
            );
        }
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

/** Creates an intrinsic HTML host factory for tags without a specialized Aurum node implementation. */
export function createGenericIntrinsicFactory<T extends HTMLElement = HTMLElement>(nodeName: string) {
    return DomNodeCreator<GenericHTMLNodeProps<T>>(nodeName, undefined, undefined, undefined, false, true);
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
    extraEvents?: MapLike<string>,
    renderSession?: RenderSession,
    bindAllValidAttributes: boolean = false
) {
    processHTMLNodeInternal(
        node,
        props,
        () => cleanUp,
        new Set([...defaultAttributes, ...(extraAttributes ?? [])].map(normalizeAttributeName)),
        createEventMap(extraEvents),
        renderSession,
        bindAllValidAttributes
    );
}

function processHTMLNodeInternal(
    node: HTMLElement,
    props: HTMLNodeProps<any>,
    getCleanUp: () => CancellationToken,
    acceptedAttributes: ReadonlySet<string>,
    eventByProp: ReadonlyMap<string, string>,
    renderSession?: RenderSession,
    bindAllValidAttributes: boolean = false
): void {
    const boundAttributes = new Set<string>();
    for (const key of Object.keys(props)) {
        const value = (props as Record<string, unknown>)[key];
        if (value === undefined) continue;

        if (key === 'dangerouslySetInnerHTML') {
            node.innerHTML = (value as { __html: string }).__html;
            continue;
        }

        const eventName = eventByProp.get(key);
        if (eventName !== undefined) {
            if (value) node.addEventListener(eventName === 'doubleclick' ? 'dblclick' : eventName, (event) => writeTo(value as never, event));
            continue;
        }
        if (reservedIntrinsicProps.has(key) || typeof value === 'function') continue;

        const attributeName = normalizeAttributeName(key);
        if (boundAttributes.has(attributeName)) continue;
        if (
            acceptedAttributes.has(attributeName) ||
            key.includes('-') ||
            (bindAllValidAttributes && isValidGenericHTMLAttribute(node, key, value))
        ) {
            assignSourceToDOM(node, value as AttributeValue, attributeName, getCleanUp, renderSession);
            boundAttributes.add(attributeName);
        }
    }

    bindStyle(node, props.style, getCleanUp, renderSession);
    bindClass(node, props.class, getCleanUp, renderSession);
}

function createEventMap(extraEvents?: MapLike<string>): ReadonlyMap<string, string> {
    const result = new Map<string, string>();
    for (const eventName of Object.keys(defaultEvents)) result.set(defaultEvents[eventName], eventName);
    if (extraEvents) {
        for (const eventName of Object.keys(extraEvents)) result.set(extraEvents[eventName], eventName);
    }
    return result;
}

export function createEventHandlers(node: HTMLElement, events: MapLike<string>, props: any) {
    for (const key in events) {
        if (props[events[key]]) {
            //@ts-ignore
            node.addEventListener(key === 'doubleclick' ? 'dblclick' : key, (e: MouseEvent) => writeTo(props[events[key]], e));
        }
    }
}

const attributeAliases: Record<string, string> = {
    accessKey: 'accesskey',
    acceptCharset: 'accept-charset',
    autoComplete: 'autocomplete',
    autoFocus: 'autofocus',
    colSpan: 'colspan',
    contentEditable: 'contenteditable',
    crossOrigin: 'crossorigin',
    dateTime: 'datetime',
    formAction: 'formaction',
    formEncType: 'formenctype',
    formMethod: 'formmethod',
    formNoValidate: 'formnovalidate',
    formTarget: 'formtarget',
    htmlFor: 'for',
    maxLength: 'maxlength',
    minLength: 'minlength',
    noValidate: 'novalidate',
    readOnly: 'readonly',
    referrerPolicy: 'referrerpolicy',
    rowSpan: 'rowspan',
    spellCheck: 'spellcheck',
    srcSet: 'srcset',
    tabIndex: 'tabindex',
    useMap: 'usemap',
    autoPlay: 'autoplay',
    strokeWidth: 'stroke-width',
    strokeLinecap: 'stroke-linecap',
    strokeLinejoin: 'stroke-linejoin'
};

const propertyNamesByAttribute: Record<string, string> = {
    'accept-charset': 'acceptCharset',
    accesskey: 'accessKey',
    autocomplete: 'autocomplete',
    autofocus: 'autofocus',
    checked: 'checked',
    colspan: 'colSpan',
    contenteditable: 'contentEditable',
    crossorigin: 'crossOrigin',
    datetime: 'dateTime',
    disabled: 'disabled',
    for: 'htmlFor',
    formnovalidate: 'formNoValidate',
    maxlength: 'maxLength',
    minlength: 'minLength',
    multiple: 'multiple',
    muted: 'muted',
    novalidate: 'noValidate',
    open: 'open',
    readonly: 'readOnly',
    referrerpolicy: 'referrerPolicy',
    required: 'required',
    rowspan: 'rowSpan',
    selected: 'selected',
    selectedindex: 'selectedIndex',
    spellcheck: 'spellcheck',
    tabindex: 'tabIndex',
    usemap: 'useMap',
    value: 'value'
};

const propertyBoundAttributes = new Set([
    'checked',
    'disabled',
    'multiple',
    'muted',
    'open',
    'readonly',
    'required',
    'selected',
    'selectedindex',
    'spellcheck',
    'value'
]);

const reservedIntrinsicProps = new Set(['children', 'class', 'className', 'decorate', 'style', 'onAttach', 'onDetach']);

function normalizeAttributeName(key: string): string {
    const alias = attributeAliases[key];
    if (alias) return alias;
    if (/^aria[A-Z]/.test(key)) return key.replace(/^aria/, 'aria-').replace(/([A-Z])/g, '-$1').toLowerCase().replace('aria--', 'aria-');
    return key;
}

function propertyNameForAttribute(attributeName: string): string {
    return propertyNamesByAttribute[attributeName.toLowerCase()] ?? attributeName;
}

function isValidGenericHTMLAttribute(node: HTMLElement, key: string, value: unknown): boolean {
    if (reservedIntrinsicProps.has(key) || key.startsWith('on') || typeof value === 'function') return false;
    const attributeName = normalizeAttributeName(key);
    if (attributeName.startsWith('aria-') || attributeName.startsWith('data-')) return true;
    return propertyNameForAttribute(attributeName) in node;
}

function bindClass(
    node: HTMLElement,
    value: ClassType | undefined,
    getCleanUp: () => CancellationToken,
    renderSession?: RenderSession
): void {
    if (!value) return;
    if (typeof value === 'string') {
        node.setAttribute('class', value);
        return;
    }
    if (value instanceof DataSource) {
        const cleanUp = getCleanUp();
        registerAurumRenderBinding(value, node, 'class', cleanUp, renderSession);
        const normalize = (next: unknown): string => Array.isArray(next) ? next.filter(Boolean).join(' ') : String(next ?? '');
        const updateClass = (next: unknown): void => {
            if (cleanUp.isCancelled) return;
            node.setAttribute('class', normalize(next));
        };
        let previousValue = normalize(value.value);
        node.setAttribute('class', previousValue);
        value.listen((next) => {
            const normalized = normalize(next);
            if (normalized === previousValue) return;
            previousValue = normalized;
            if (renderBatchState.active) queueRenderUpdate(updateClass, updateClass, normalized);
            else updateClass(normalized);
        }, cleanUp);
        return;
    }
    const cleanUp = getCleanUp();
    const result = handleClass(value, cleanUp);
    if (result instanceof DataSource) {
        registerAurumRenderBinding(result, node, 'class', cleanUp, renderSession);
        const updateClass = (next: string): void => {
            if (cleanUp.isCancelled) return;
            node.setAttribute('class', next);
        };
        result.listenAndRepeat((next) => {
            if (renderBatchState.active) queueRenderUpdate(updateClass, updateClass, next);
            else updateClass(next);
        }, cleanUp);
    } else {
        node.setAttribute('class', result);
    }
}

function bindStyle(
    node: HTMLElement,
    value: StyleType | undefined,
    getCleanUp: () => CancellationToken,
    renderSession?: RenderSession
): void {
    if (!value) return;
    if (typeof value === 'string') {
        node.setAttribute('style', value);
        return;
    }
    const cleanUp = getCleanUp();
    const result = handleStyle(value, cleanUp);
    if (result instanceof DataSource) {
        registerAurumRenderBinding(result, node, 'style', cleanUp, renderSession);
        const updateStyle = (next: string): void => {
            if (cleanUp.isCancelled) return;
            node.setAttribute('style', next);
        };
        result.listenAndRepeat((next) => {
            if (renderBatchState.active) queueRenderUpdate(updateStyle, updateStyle, next);
            else updateStyle(next);
        }, cleanUp);
    } else {
        node.setAttribute('style', result);
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
        content: renderedContent as HTMLElement,
        fireOnAttach: () => rs.attachCalls.forEach((c) => c()),
        dispose: () => rs.sessionToken.cancel()
    };
}

function assignSourceToDOM(
    node: HTMLElement,
    data: AttributeValue,
    attributeName: string,
    getCleanUp: () => CancellationToken,
    renderSession?: RenderSession
) {
    const propertyName = propertyNameForAttribute(attributeName);
    const bindAsProperty = propertyBoundAttributes.has(attributeName.toLowerCase()) && propertyName in node;
    const assign = (value: string | number | boolean): void => {
        if (bindAsProperty) {
            (node as unknown as Record<string, unknown>)[propertyName] = value;
        } else if (typeof value === 'boolean') {
            if (value) node.setAttribute(attributeName, '');
            else node.removeAttribute(attributeName);
        } else {
            node.setAttribute(attributeName, value.toString());
        }
    };

    if (typeof data === 'string' || typeof data === 'number') {
        assign(data);
    } else if (typeof data === 'boolean') {
        assign(data);
    } else if (data instanceof DataSource) {
        const cleanUp = getCleanUp();
        registerAurumRenderBinding(data, node, `${bindAsProperty ? 'property' : 'attribute'}:${attributeName}`, cleanUp, renderSession);
        if (typeof data.value === 'string' || typeof data.value === 'number' || typeof data.value === 'boolean') assign(data.value);
        const updateAttribute = (v: AttributeValue): void => {
            if (cleanUp.isCancelled) return;
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') assign(v);
        };
        let previousValue = data.value;
        data.listen((v) => {
            if (v === previousValue || (Number.isNaN(v) && Number.isNaN(previousValue))) return;
            previousValue = v;
            if (renderBatchState.active) queueRenderUpdate(updateAttribute, updateAttribute, v);
            else updateAttribute(v);
        }, cleanUp);
    } else {
        throw new Error('Attributes only support types boolean, string, number and data sources');
    }
}
