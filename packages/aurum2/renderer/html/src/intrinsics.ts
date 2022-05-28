import { CancellationToken } from '@aurum/core';

export type AttributeValue = string | boolean;
export type ClassType = string | Array<string>;
export type DataDrain<T> = (value: T) => void;

export interface HTMLNodeProps<T> {
    id?: AttributeValue;
    name?: AttributeValue;
    draggable?: AttributeValue;
    class?: ClassType;
    tabindex?: AttributeValue;
    style?: AttributeValue;
    title?: AttributeValue;
    role?: AttributeValue;
    slot?: AttributeValue;
    contenteditable?: AttributeValue;
    onContextMenu?: DataDrain<MouseEvent>;
    onDblClick?: DataDrain<MouseEvent>;
    onClick?: DataDrain<MouseEvent>;
    onKeyDown?: DataDrain<KeyboardEvent>;
    onKeyUp?: DataDrain<KeyboardEvent>;
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

    onAttach?: (node: T) => void;
    onDetach?: (node: T) => void;
}

export interface AProps extends HTMLNodeProps<HTMLAnchorElement> {
    href?: AttributeValue;
    hreflang?: AttributeValue;
    media?: AttributeValue;
    download?: AttributeValue;
    target?: AttributeValue;
    ping?: AttributeValue;
    referrerpolicy?: AttributeValue;
    rel?: AttributeValue;
    type?: AttributeValue;
}

export const Div = DomNodeCreator<HTMLNodeProps<HTMLDivElement>>('div');
export const A = DomNodeCreator<AProps>('a', ['href', 'target', 'hreflang', 'media', 'download', 'ping', 'referrerpolicy', 'rel', 'type']);
export const Span = DomNodeCreator<HTMLNodeProps<HTMLSpanElement>>('span');

export function DomNodeCreator<T extends HTMLNodeProps<any>>(
    nodeName: string,
    extraAttributes?: string[],
    extraEvents?: Record<string, string>,
    extraLogic?: (node: HTMLElement, props: T, cleanUp: CancellationToken) => void
): any {
    return function (props: T): HTMLElement {
        const node = document.createElement(nodeName);
        if (props) {
            processHTMLNode(node, props, CancellationToken.forever, extraAttributes, extraEvents);
        }
        return node;
    };
}

/**
 * @internal
 */
export const defaultEvents: Record<string, string> = {
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
    keyhit: 'onKeyHit',
    keyup: 'onKeyUp',
    contextmenu: 'onContextMenu',
    mousedown: 'onMouseDown',
    mouseup: 'onMouseUp',
    mousemove: 'onMouseMove',
    mouseenter: 'onMouseEnter',
    mouseleave: 'onMouseLeave',
    mousewheel: 'onMouseWheel',
    load: 'onLoad',
    error: 'onError'
};

/**
 * @internal
 */
export const defaultAttributes: string[] = ['id', 'name', 'draggable', 'tabindex', 'style', 'role', 'contenteditable', 'slot', 'title'];

export function processHTMLNode(
    node: HTMLElement,
    props: HTMLNodeProps<any>,
    cleanUp: CancellationToken,
    extraAttributes?: string[],
    extraEvents?: Record<string, string>
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

    if (props.class) {
        handleClass(node, props.class, cleanUp);
    }
}

export function createEventHandlers(node: HTMLElement, events: Record<string, string>, props: any): void {
    for (const key in events) {
        if (props[events[key]]) {
            node.addEventListener(key, (e: MouseEvent) => props[events[key]](e));
        }
    }
}

function bindProps(node: HTMLElement, keys: string[], props: any, cleanUp: CancellationToken, dynamicProps?: string[]): void {
    for (const key of keys) {
        if (props[key]) {
            assignStringSourceToAttribute(node, props[key], key, cleanUp);
        }
    }
    if (dynamicProps) {
        for (const key of dynamicProps) {
            if (props[key]) {
                assignStringSourceToAttribute(node, props[key], key, cleanUp);
            }
        }
    }
}

function assignStringSourceToAttribute(node: HTMLElement, data: string, key: string, cleanUp: CancellationToken): void {
    if (typeof data === 'string') {
        node.setAttribute(key, data);
    } else if (typeof data === 'boolean') {
        if (data) {
            node.setAttribute(key, '');
        }
    } else {
        throw new Error('Attributes only support types boolean, string, number and data sources');
    }
}

function handleClass(node: HTMLElement, data: ClassType, cleanUp: CancellationToken) {
    if (typeof data === 'string') {
        node.className = data;
    } else {
        const value: string = (data as Array<string>).reduce<string>((p, c) => {
            if (!c) {
                return p;
            }
            return `${p} ${c}`;
        }, '');
        node.className = value;
    }
}
