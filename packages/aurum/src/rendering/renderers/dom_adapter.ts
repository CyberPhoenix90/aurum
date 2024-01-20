import { handleClass, handleStyle } from '../../nodes/rendering_helpers.js';
import { AurumComponentAPI, AurumElement, createRenderSession, Renderable, Rendered, renderInternal } from '../aurum_element.js';
import { DataSource } from '../../stream/data_source.js';
import { dsUnique } from '../../stream/data_source_operators.js';
import { DuplexDataSource } from '../../stream/duplex_data_source.js';
import { CancellationToken } from '../../utilities/cancellation_token.js';
import { AttributeValue, Callback, ClassType, DataDrain, MapLike, StringSource, StyleType } from '../../utilities/common.js';
import { AurumDecorator } from '../../utilities/aurum.js';

export interface HTMLNodeProps<T> {
    decorate?: AurumDecorator | AurumDecorator[];
    id?: AttributeValue;
    name?: AttributeValue;
    draggable?: AttributeValue;
    class?: ClassType;
    tabindex?: AttributeValue;
    style?: StyleType;
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
export const defaultAttributes: string[] = ['id', 'name', 'draggable', 'tabindex', 'role', 'contenteditable', 'slot', 'title'];

export function DomNodeCreator<T extends HTMLNodeProps<any>>(
    nodeName: string,
    extraAttributes?: string[],
    extraEvents?: MapLike<string>,
    extraLogic?: (node: HTMLElement, props: T, cleanUp: CancellationToken) => void,
    svg: boolean = false
) {
    return function (props: T, children: Renderable[], api: AurumComponentAPI): HTMLElement {
        let node;
        if (svg) {
            node = document.createElementNS('http://www.w3.org/2000/svg', nodeName);
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
                    'Unexpected child type passed to DOM Node: function. Did you mean to use a component? To use a component use JSX syntax such as <MyComponent/> it works even with function references. <props.myReference/>'
                );
            }

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
