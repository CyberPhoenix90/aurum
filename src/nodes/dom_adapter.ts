import { StringSource, ClassType, DataDrain, Callback, MapLike } from '../utilities/common';
import { DataSource, ReadOnlyDataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
import { Renderable, AurumComponentAPI, AurumElement, Rendered } from '../rendering/aurum_element';
import { CancellationToken } from '../utilities/cancellation_token';

export interface HTMLNodeProps<T> {
	id?: StringSource;
	name?: StringSource;
	draggable?: StringSource;
	class?: ClassType;
	tabindex?: ClassType;
	style?: StringSource;
	title?: StringSource;
	role?: StringSource;
	slot?: StringSource;
	contentEditable?: StringSource;
	onDblclick?: DataDrain<MouseEvent>;
	onClick?: DataDrain<MouseEvent>;
	onKeydown?: DataDrain<KeyboardEvent>;
	onKeyup?: DataDrain<KeyboardEvent>;
	onMousedown?: DataDrain<KeyboardEvent>;
	onMouseup?: DataDrain<KeyboardEvent>;
	onMouseenter?: DataDrain<KeyboardEvent>;
	onMouseleave?: DataDrain<KeyboardEvent>;
	onMousewheel?: DataDrain<WheelEvent>;
	onBlur?: DataDrain<FocusEvent>;
	onFocus?: DataDrain<FocusEvent>;
	onDrag?: DataDrain<DragEvent>;
	onDragend?: DataDrain<DragEvent>;
	onDragenter?: DataDrain<DragEvent>;
	onDragexit?: DataDrain<DragEvent>;
	onDragleave?: DataDrain<DragEvent>;
	onDragover?: DataDrain<DragEvent>;
	onDragstart?: DataDrain<DragEvent>;
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
	blur: 'onBlur',
	focus: 'onFocus',
	click: 'onClick',
	dblclick: 'onDblClick',
	keydown: 'onKeyDown',
	keyhit: 'onKeyHit',
	keyup: 'onKeyUp',
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
export const defaultAttributes: string[] = ['id', 'name', 'draggable', 'tabindex', 'style', 'role', 'contentEditable', 'slot'];

export function DomNodeCreator<T extends HTMLNodeProps<any>>(
	nodeName: string,
	extraAttributes?: string[],
	extraEvents?: MapLike<string>,
	extraLogic?: (node: HTMLElement, props: T, cleanUp: CancellationToken) => void
) {
	return function(props: T, children: Renderable[], api: AurumComponentAPI): HTMLElement {
		const node = document.createElement(nodeName);
		if (props) {
			processHTMLNode(node, props, api.cancellationToken, extraAttributes, extraEvents);
		}
		const renderedChildren = api.prerender(children);
		connectChildren(node, renderedChildren);
		if (props.onAttach) {
			api.onAttach(() => props.onAttach(node));
		}
		if (props.onDetach) {
			api.onDetach(() => props.onDetach(node));
		}

		extraLogic?.(node, props, api.cancellationToken);

		return node;
	};
}

function connectChildren(target: HTMLElement, children: Rendered | Rendered[]): void {
	if (children === undefined || children === null) {
		return;
	}

	if (Array.isArray(children)) {
		for (const child of children) {
			connectChildren(target, child);
		}
		return;
	}

	if (children instanceof AurumElement) {
		children.attachToDom(target, target.childNodes.length);
	} else if (children instanceof HTMLElement || children instanceof Text) {
		target.appendChild(children);
	} else {
		throw new Error(`Unexpected child type passed to DOM Node: ${children}`);
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
	bindProps(node, defaultAttributes, props, dataProps);
	if (extraAttributes) {
		bindProps(node, extraAttributes, props);
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

function bindProps(node: HTMLElement, keys: string[], props: any, dynamicProps?: string[]) {
	for (const key of keys) {
		if (props[key]) {
			assignStringSourceToAttribute(node, props[key], key);
		}
	}
	if (dynamicProps) {
		for (const key of dynamicProps) {
			if (props[key]) {
				assignStringSourceToAttribute(node, props[key], key);
			}
		}
	}
}

function assignStringSourceToAttribute(node: HTMLElement, data: StringSource, key: string) {
	if (typeof data === 'string' || typeof data === 'boolean') {
		node.setAttribute(key, data);
	} else if (data instanceof DataSource || data instanceof DuplexDataSource) {
		if (data.value) {
			node.setAttribute(key, data.value);
		}
		data.unique().listen((v) => (node as HTMLElement).setAttribute(key, v));
	} else {
		throw new Error('Attributes only support types boolean, string, number and data sources');
	}
}

function handleClass(node: HTMLElement, data: ClassType, cleanUp: CancellationToken) {
	if (typeof data === 'string') {
		node.className = data;
	} else if (data instanceof DataSource || data instanceof DuplexDataSource) {
		if (data.value) {
			if (Array.isArray(data.value)) {
				node.className = data.value.join(' ');
				data.unique(cleanUp).listen(() => {
					node.className = (data.value as string[]).join(' ');
				});
			} else {
				node.className = data.value;
				data.unique(cleanUp).listen(() => {
					node.className = data.value as string;
				});
			}
		}
		data.unique(cleanUp).listen((v) => ((node as HTMLElement).className = v));
	} else {
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
		for (const i of data as Array<string | ReadOnlyDataSource<string>>) {
			if (i instanceof DataSource) {
				i.unique(cleanUp).listen((v) => {
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
