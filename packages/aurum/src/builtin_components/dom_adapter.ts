import { StringSource, ClassType, DataDrain, Callback, MapLike, AttributeValue } from '../utilities/common.js';
import { DataSource, ReadOnlyDataSource } from '../stream/data_source.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { Renderable, AurumComponentAPI, AurumElement, Rendered, render } from '../rendering/aurum_element.js';
import { CancellationToken } from '../utilities/cancellation_token.js';
import { dsUnique } from '../stream/data_source_operators.js';

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
    contentEditable?: AttributeValue;
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
export const defaultAttributes: string[] = ['id', 'name', 'draggable', 'tabindex', 'style', 'role', 'contentEditable', 'slot', 'title'];

export function DomNodeCreator<T extends HTMLNodeProps<any>>(
    nodeName: string,
    extraAttributes?: string[],
    extraEvents?: MapLike<string>,
    extraLogic?: (node: HTMLElement, props: T, cleanUp: CancellationToken) => void
) {
    return function (props: T, children: Renderable[], api: AurumComponentAPI): HTMLElement {
        const node = document.createElement(nodeName);
        if (props) {
            processHTMLNode(node, props, api.cancellationToken, extraAttributes, extraEvents);
        }
        //@ts-ignore
        const renderedChildren = render(children, api.renderSession);
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
        if (child instanceof Text || child instanceof HTMLElement) {
            target.appendChild(child);
        } else if (child instanceof AurumElement) {
            child.attachToDom(target, target.childNodes.length);
        } else {
            throw new Error(`Unexpected child type passed to DOM Node: ${children}`);
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

    if (props.class) {
        handleClass(node, props.class, cleanUp);
    }
}

export function createEventHandlers(node: HTMLElement, events: MapLike<string>, props: any) {
    for (const key in events) {
        if (props[events[key]]) {
            if (props[events[key]] instanceof DataSource) {
                //@ts-ignore
                node.addEventListener(key, (e: MouseEvent) => props[events[key]].update(e));
            } else if (props[events[key]] instanceof DuplexDataSource) {
                //@ts-ignore
                node.addEventListener(key, (e: MouseEvent) => props[events[key]].updateDownstream(e));
            } else if (typeof props[events[key]] === 'function') {
                //@ts-ignore
                node.addEventListener(key, (e: MouseEvent) => props[events[key]](e));
            }
        }
    }
}

function bindProps(node: HTMLElement, keys: string[], props: any, cleanUp: CancellationToken, dynamicProps?: string[]) {
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

function assignStringSourceToAttribute(node: HTMLElement, data: StringSource, key: string, cleanUp: CancellationToken) {
    if (typeof data === 'string') {
        node.setAttribute(key, data);
    } else if (typeof data === 'boolean') {
        if (data) {
            node.setAttribute(key, '');
        }
    } else if (data instanceof DataSource || data instanceof DuplexDataSource) {
        if (typeof data.value === 'string') {
            node.setAttribute(key, data.value);
        } else if (typeof data.value === 'boolean') {
            if (data.value) {
                node.setAttribute(key, '');
            }
        }
        data.transform(dsUnique(), cleanUp).listen((v) => {
            if (typeof v === 'string') {
                node.setAttribute(key, v);
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

function handleClass(node: HTMLElement, data: ClassType, cleanUp: CancellationToken) {
    if (typeof data === 'string') {
        node.className = data;
    } else if (data instanceof DataSource || data instanceof DuplexDataSource) {
        data.transform(dsUnique(), cleanUp)
            .withInitial(data.value)
            .listenAndRepeat((v) => {
                if (Array.isArray(v)) {
                    node.className = v.join(' ');
                } else {
                    node.className = v;
                }
            });
    } else {
        const value: string = (data as Array<string | ReadOnlyDataSource<string>>).reduce<string>((p, c) => {
            if (!c) {
                return p;
            }
            if (typeof c === 'string') {
                return `${p} ${c}`;
            } else {
                if (c.value) {
                    return `${p} ${c.value}`;
                } else {
                    return p;
                }
            }
        }, '');
        node.className = value;
        for (const i of data as Array<string | ReadOnlyDataSource<string>>) {
            if (i instanceof DataSource) {
                i.transform(dsUnique(), cleanUp).listen((v) => {
                    const value: string = (data as Array<string | ReadOnlyDataSource<string>>).reduce<string>((p, c) => {
                        if (typeof c === 'string') {
                            return `${p} ${c}`;
                        } else {
                            if (c.value) {
                                return `${p} ${c.value}`;
                            } else {
                                return p;
                            }
                        }
                    }, '');
                    node.className = value;
                });
            }
        }
    }
}
