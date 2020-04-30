import { ArrayDataSource, DataSource, ReadOnlyDataSource } from '../../stream/data_source';
import { Callback, ClassType, DataDrain, MapLike, AttributeValue } from '../../utilities/common';
import { ownerSymbol } from '../../utilities/owner_symbol';
import { AurumTextElement } from './aurum_text';
import { EventEmitter } from '../../utilities/event_emitter';
import { DuplexDataSource } from '../../stream/duplex_data_source';
import { CancellationToken } from '../../utilities/cancellation_token';

/**
 * @inernal
 */
export const aurumElementModelIdentitiy = Symbol('AurumElementModel');

export interface AurumElementModel {
	[aurumElementModelIdentitiy]: boolean;
	constructor: (props: AurumElementProps<HTMLElement>, innerNodes: ChildNode[]) => AurumElement;
	props: AurumElementProps<HTMLElement>;
	innerNodes: ChildNode[];
}

export interface AurumElementProps<T extends HTMLElement> {
	id?: AttributeValue;
	name?: AttributeValue;
	draggable?: AttributeValue;
	class?: ClassType;
	tabindex?: ClassType;
	style?: AttributeValue;
	title?: AttributeValue;
	role?: AttributeValue;
	contentEditable?: AttributeValue;
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
	onCreate?: Callback<T>;
}

/**
 * @internal
 */
const defaultEvents: MapLike<string> = {
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
const defaultProps: string[] = ['id', 'name', 'draggable', 'tabindex', 'style', 'role', 'contentEditable'];

export function prerender(model: any): Renderable {
	if (model && model[aurumElementModelIdentitiy]) {
		const result = model.constructor(model.props, model.innerNodes);
		return prerender(result as any);
	} else {
		return model;
	}
}

export type Renderable =
	| AurumElement
	| string
	| Promise<Renderable>
	| DataSource<string>
	| DataSource<AurumElement>
	| DataSource<AurumElement[]>
	| ArrayDataSource<AurumElement>
	| ChildNode[];

export type ChildNode =
	| AurumElementModel
	| string
	| Promise<ChildNode>
	| DataSource<string>
	| DataSource<AurumElementModel>
	| DataSource<AurumElementModel[]>
	| ArrayDataSource<AurumElementModel>
	| ChildNode[];

export abstract class AurumElement {
	private onAttach?: Callback<HTMLElement>;
	private onDetach?: Callback<HTMLElement>;

	private children: Array<AurumElement | AurumFragment | AurumTextElement>;
	protected needAttach: boolean;

	public node: HTMLElement;
	private cleanUp: CancellationToken;

	constructor(props: AurumElementProps<any>, children: ChildNode[], domNodeName: string) {
		this.node = this.create(domNodeName);
		this.children = [];

		if (props != null) {
			if (props.onAttach) {
				this.onAttach = props.onAttach;
				this.needAttach = true;
			}
			this.onDetach = props.onDetach;

			this.initialize(props);
			props.onCreate?.(this.node);
		}
		if (children) {
			this.addChildren(children);
		}
	}

	private initialize(props: AurumElementProps<any>) {
		this.createEventHandlers(defaultEvents, props);

		const dataProps = Object.keys(props).filter((e) => e.includes('-'));
		this.bindProps(defaultProps, props, dataProps);

		if (props.class) {
			this.handleClass(props.class);
		}
	}

	protected bindProps(keys: string[], props: any, dynamicProps?: string[]) {
		for (const key of keys) {
			if (props[key]) {
				this.assignStringSourceToAttribute(props[key], key);
			}
		}
		if (dynamicProps) {
			for (const key of dynamicProps) {
				if (props[key]) {
					this.assignStringSourceToAttribute(props[key], key);
				}
			}
		}
	}

	protected createEventHandlers(events: MapLike<string>, props: any) {
		for (const key in events) {
			if (props[events[key]]) {
				if (props[events[key]] instanceof DataSource) {
					this.node.addEventListener(key, (e: Event) => props[events[key]].update(e));
				} else if (props[events[key]] instanceof DuplexDataSource) {
					this.node.addEventListener(key, (e: Event) => props[events[key]].updateDownstream(e));
				} else if (typeof props[events[key]] === 'function') {
					this.node.addEventListener(key, (e: Event) => props[events[key]](e));
				}
			}
		}
	}

	protected render(): void {
		let absoluteIndex: number = 0;
		for (let i = 0; i < this.children.length; i++, absoluteIndex++) {
			if (this.children[i] instanceof AurumFragment) {
				absoluteIndex = this.renderFragment(this.children[i] as AurumFragment, absoluteIndex);
			} else {
				this.renderChild(this.children[i] as AurumElement, absoluteIndex);
			}
		}
		while (this.node.childNodes.length > absoluteIndex) {
			const child = this.node.childNodes[this.node.childNodes.length - 1];
			this.node.removeChild(child);
			child[ownerSymbol]?.handleDetach?.();
		}
	}

	protected renderFragment(fragment: AurumFragment, absoluteIndex: number) {
		for (let j = 0; j < fragment.children.length; j++, absoluteIndex++) {
			if (fragment.children[j] instanceof AurumFragment) {
				absoluteIndex = this.renderFragment(fragment.children[j] as AurumFragment, absoluteIndex);
			} else {
				this.renderChild(fragment.children[j] as AurumElement | AurumTextElement, absoluteIndex);
			}
		}
		absoluteIndex--;
		return absoluteIndex;
	}

	private renderChild(child: AurumElement | AurumTextElement, index: number) {
		if (this.node.childNodes.length <= index) {
			return this.addChildDom(child as AurumElement);
		}
		if (this.node.childNodes[index][ownerSymbol] !== child) {
			const childIndex = this.getChildIndex(child.node as any);
			if (childIndex !== -1) {
				this.swapChildrenDom(index, childIndex);
			} else {
				this.addDomNodeAt(child.node, index);
			}
		}
	}

	protected assignStringSourceToAttribute(data: AttributeValue, key: string) {
		if (typeof data === 'string' || typeof data === 'boolean') {
			if (typeof data === 'boolean') {
				if (data) {
					this.node.setAttribute(key, '');
				} else {
					this.node.removeAttribute(key);
				}
			} else {
				(this.node as HTMLElement).setAttribute(key, data);
			}
		} else {
			if (!this.cleanUp) {
				this.cleanUp = new CancellationToken();
			}
			data.unique(this.cleanUp).listenAndRepeat((v) => {
				if (typeof v === 'boolean') {
					if (v) {
						this.node.setAttribute(key, '');
					} else {
						this.node.removeAttribute(key);
					}
				} else {
					(this.node as HTMLElement).setAttribute(key, v);
				}
			});
		}
	}

	protected handleAttach(parent: AurumElement) {
		if (this.needAttach) {
			if (parent.isConnected()) {
				this.onAttach?.(this.node);
				for (const child of this.node.childNodes) {
					child[ownerSymbol]?.handleAttach?.(this);
				}
			} else {
				parent.needAttach = true;
			}
		}
	}

	//@ts-ignore
	private handleDetach() {
		if (this.cleanUp) {
			this.cleanUp.cancel();
		}
		if (!this.node.isConnected) {
			this.onDetach?.(this.node);
			for (const child of this.children) {
				if (child instanceof AurumFragment) {
					child.handleDetach();
				}
			}
			for (const child of this.node.childNodes) {
				if (child[ownerSymbol]) {
					child[ownerSymbol].handleDetach?.();
				}
			}
		}
	}

	private handleClass(data: ClassType) {
		if (typeof data === 'string') {
			this.node.className = data;
		} else if (data instanceof DataSource || data instanceof DuplexDataSource) {
			if (!this.cleanUp) {
				this.cleanUp = new CancellationToken();
			}

			if (data.value) {
				if (Array.isArray(data.value)) {
					this.node.className = data.value.join(' ');
					data.unique(this.cleanUp).listen(() => {
						(this.node as HTMLElement).className = (data.value as string[]).join(' ');
					});
				} else {
					this.node.className = data.value;
					data.unique(this.cleanUp).listen(() => {
						(this.node as HTMLElement).className = data.value as string;
					});
				}
			}
			data.unique(this.cleanUp).listen((v) => ((this.node as HTMLElement).className = v));
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
			this.node.className = value;
			for (const i of data as Array<string | ReadOnlyDataSource<string>>) {
				if (i instanceof DataSource) {
					if (!this.cleanUp) {
						this.cleanUp = new CancellationToken();
					}

					i.unique(this.cleanUp).listen((v) => {
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
						(this.node as HTMLElement).className = value;
					});
				}
			}
		}
	}

	protected create(domNodeName: string): HTMLElement {
		const node = document.createElement(domNodeName);
		node[ownerSymbol] = this;
		return node;
	}

	protected getChildIndex(node: HTMLElement): number {
		let i = 0;
		for (const child of this.node.childNodes) {
			if (child === node) {
				return i;
			}
			i++;
		}
		return -1;
	}

	protected hasChild(node: HTMLElement): boolean {
		for (const child of node.childNodes) {
			if (child === node) {
				return true;
			}
		}
		return false;
	}

	protected addChildDom(child: AurumElement): void {
		this.node.appendChild(child.node);
		child.handleAttach?.(this);
	}

	protected swapChildrenDom(indexA: number, indexB: number) {
		if (indexA === indexB) {
			return;
		}

		const nodeA = this.node.childNodes[indexA];
		const nodeB = this.node.childNodes[indexB];
		nodeA.remove();
		nodeB.remove();
		if (indexA < indexB) {
			this.addDomNodeAt(nodeB as HTMLElement, indexA);
			this.addDomNodeAt(nodeA as HTMLElement, indexB);
		} else {
			this.addDomNodeAt(nodeA as HTMLElement, indexB);
			this.addDomNodeAt(nodeB as HTMLElement, indexA);
		}
	}

	protected addDomNodeAt(node: HTMLElement | Text, index: number): void {
		if (index >= this.node.childNodes.length) {
			this.node.appendChild(node);
			node[ownerSymbol].handleAttach?.(this);
		} else {
			this.node.insertBefore(node, this.node.childNodes[index]);
			node[ownerSymbol].handleAttach?.(this);
		}
	}

	public remove(): void {
		if (this.hasParent()) {
			this.node.parentElement[ownerSymbol].removeChild(this.node);
		}
	}

	public hasParent(): boolean {
		return !!this.node.parentElement;
	}

	public isConnected(): boolean {
		return this.node.isConnected;
	}

	public removeChild(child: AurumElement): void {
		const index = this.children.indexOf(child);
		if (index !== -1) {
			this.children.splice(index, 1);
		}
		this.render();
	}

	public removeChildAt(index: number): void {
		this.children.splice(index, 1);
		this.render();
	}

	public swapChildren(indexA: number, indexB: number): void {
		if (indexA === indexB) {
			return;
		}

		const nodeA = this.children[indexA];
		const nodeB = this.children[indexB];
		this.children[indexA] = nodeB;
		this.children[indexB] = nodeA;
		this.render();
	}

	public clearChildren(): void {
		this.children.length = 0;
		this.render();
	}

	public addChild(child: ChildNode): void {
		if (child === undefined || child === null) {
			return;
		}

		if (child[aurumElementModelIdentitiy]) {
			//@ts-ignore
			child = prerender(child as AurumElementModel);
			if (child === undefined) {
				return;
			}
		}

		if (Array.isArray(child)) {
			for (const subChild of child) {
				this.addChild(subChild);
			}
			return;
		}

		this.children.push(this.childNodeToAurum(child));
		this.render();
	}

	private childNodeToAurum(child: ChildNode): AurumElement | AurumFragment | AurumTextElement {
		if (child instanceof AurumElement) {
			return child;
		}

		if (child instanceof Promise) {
			const result = new AurumFragment({});
			//@ts-ignore
			child.then((value) => {
				result.addChildren([value]);
				this.render();
			});
			return result;
		} else if (child instanceof ArrayDataSource) {
			//@ts-ignore
			const result = new AurumFragment({ repeatModel: child });
			result.onChange.subscribe(() => this.render());
			return result;
		} else if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean' || typeof child === 'bigint') {
			return new AurumTextElement(child.toString());
		} else if (child instanceof DataSource) {
			//@ts-ignore
			const result = new AurumFragment({}, [child]);
			result.onChange.subscribe(() => this.render());
			return result;
		} else {
			throw new Error('Unsupported child type');
		}
	}

	public addChildAt(child: ChildNode, index: number): void {
		this.children.splice(index, 0, this.childNodeToAurum(child));
		this.render();
	}

	public addChildren(nodes: ChildNode[]): void {
		if (nodes.length === 0) {
			return;
		}

		for (const child of nodes) {
			this.addChild(child);
		}
	}
}

/**
 * @internal
 */
export interface AurumFragmentProps {
	repeatModel?: ArrayDataSource<AurumElementModel>;
}

/**
 * @internal
 */
export class AurumFragment {
	public children: Array<AurumElement | AurumTextElement | AurumFragment>;
	public onChange: EventEmitter<void>;
	private cancellationToken: CancellationToken;

	constructor(props: AurumFragmentProps, children?: ChildNode[]) {
		this.cancellationToken = new CancellationToken();
		this.onChange = new EventEmitter();
		this.children = [];
		if (props.repeatModel) {
			this.handleRepeat(props.repeatModel);
		} else if (children) {
			this.addChildren(children);
		}
	}

	public handleDetach() {
		this.cancellationToken.cancel();
	}

	public addChildren(children: ChildNode[]) {
		for (const child of children) {
			let renderable;
			if (child[aurumElementModelIdentitiy]) {
				renderable = prerender(child as any);
			} else {
				renderable = child;
			}
			if (renderable instanceof AurumElement) {
				this.children.push(renderable);
			} else if (renderable instanceof DataSource) {
				let sourceChild = undefined;
				let wasArray: boolean;
				const freshnessToken = { ts: undefined };
				renderable.unique().listenAndRepeat((newValue) => {
					freshnessToken.ts = Date.now();
					if ((newValue === undefined || newValue === null) && wasArray) {
						this.children.length = 0;
						this.onChange.fire();
						wasArray = false;
						return;
					} else if (!Array.isArray(newValue) && wasArray) {
						this.children.length = 0;
						this.onChange.fire();
						wasArray = false;
					}

					if (Array.isArray(newValue)) {
						wasArray = true;
						this.children.length = 0;
						this.onChange.fire();
						for (const newSubValue of newValue) {
							this.handleSourceChild(newSubValue, undefined, undefined, freshnessToken, freshnessToken.ts);
						}
					} else {
						sourceChild = this.handleSourceChild(newValue, sourceChild, renderable, freshnessToken, freshnessToken.ts);
					}
				}, this.cancellationToken);
			} else {
				throw new Error('case not yet implemented');
			}
		}
	}

	private handleSourceChild(newValue: any, sourceChild: any, dataSource, freshnessToken: { ts: number }, timestamp: number) {
		if (Array.isArray(newValue)) {
			for (const item of newValue) {
				this.handleSourceChild(item, sourceChild, dataSource, freshnessToken, timestamp);
			}
		}

		if (newValue === undefined || newValue === null) {
			if (sourceChild) {
				this.children.splice(this.children.indexOf(sourceChild), 1);
				sourceChild = undefined;
				this.onChange.fire();
			}
			return;
		}
		if (newValue[aurumElementModelIdentitiy]) {
			newValue = prerender(newValue);
		}

		if (typeof newValue === 'string' || typeof newValue === 'bigint' || typeof newValue === 'number' || typeof newValue === 'boolean') {
			if (!sourceChild) {
				const textNode = new AurumTextElement(dataSource ?? newValue);
				this.children.push(textNode);
				sourceChild = textNode;
				this.onChange.fire();
			} else if (sourceChild instanceof AurumElement) {
				const textNode = new AurumTextElement(dataSource ?? newValue);
				this.children.splice(this.children.indexOf(sourceChild), 1, textNode);
				sourceChild = textNode;
				this.onChange.fire();
			}
		} else if (newValue instanceof AurumElement) {
			if (newValue !== sourceChild) {
				if (sourceChild) {
					this.children.splice(this.children.indexOf(sourceChild), 1, newValue);
				} else {
					this.children.push(newValue);
				}
				sourceChild = newValue;
				this.onChange.fire();
			}
		} else if (newValue instanceof Promise) {
			newValue.then((value) => {
				if (freshnessToken.ts === timestamp) {
					this.addChildren([value]);
					this.onChange.fire();
				}
			});
		} else if (newValue instanceof DataSource) {
			if (!sourceChild) {
				const result = new AurumFragment({}, [newValue]);
				sourceChild = result;
				this.children.push(result);
				result.onChange.subscribe(() => this.onChange.fire());
				this.onChange.fire();
			} else if (sourceChild !== newValue) {
				const result = new AurumFragment({}, [newValue]);
				result.onChange.subscribe(() => this.onChange.fire());
				this.children.splice(this.children.indexOf(sourceChild), 1, result);
				sourceChild = result;
				this.onChange.fire();
			}
		} else if (newValue instanceof ArrayDataSource) {
			if (!sourceChild) {
				const result = new AurumFragment({ repeatModel: newValue });
				sourceChild = result;
				this.children.push(result);
				result.onChange.subscribe(() => this.onChange.fire());
				this.onChange.fire();
			} else if (sourceChild !== newValue) {
				const result = new AurumFragment({ repeatModel: newValue });
				result.onChange.subscribe(() => this.onChange.fire());
				this.children.splice(this.children.indexOf(sourceChild), 1, result);
				sourceChild = result;
				this.onChange.fire();
			}
		}
		return sourceChild;
	}

	private handleRepeat(dataSource: ArrayDataSource<AurumElementModel>): void {
		dataSource.listenAndRepeat((change) => {
			switch (change.operationDetailed) {
				case 'replace':
					//@ts-ignore
					this.children[change.index] = prerender(change.items[0]);
					break;
				case 'swap':
					const itemA = this.children[change.index];
					const itemB = this.children[change.index2];
					this.children[change.index2] = itemA;
					this.children[change.index] = itemB;
					break;
				case 'merge':
					const source = change.previousState.slice();
					for (let i = 0; i < change.newState.length; i++) {
						if (this.children.length <= i) {
							//@ts-ignore
							this.children.push(prerender(change.newState[i]));
						}
						if (source[i] !== change.newState[i]) {
							const index = source.indexOf(change.newState[i]);
							if (index !== -1) {
								const a = this.children[i];
								const b = this.children[index];
								this.children[i] = b;
								this.children[index] = a;
								const c = source[i];
								const d = source[index];
								source[i] = d;
								source[index] = c;
							} else {
								//@ts-ignore
								this.children.splice(i, 0, prerender(change.newState[i]));
								source.splice(i, 0, change.newState[i]);
							}
						}
					}
					if (this.children.length > change.newState.length) {
						this.children.length = change.newState.length;
					}
					break;
				case 'append':
					//@ts-ignore
					this.children = this.children.concat(change.items.map(prerender));
					break;
				case 'prepend':
					//@ts-ignore
					this.children.unshift(...change.items.map(prerender));
					break;
				case 'remove':
				case 'removeLeft':
				case 'removeRight':
					this.children.splice(change.index, change.count);
					break;
				case 'clear':
					this.children = [];
					break;
				default:
					throw new Error('unhandled operation');
			}
			this.onChange.fire();
		}, this.cancellationToken);
	}
}
