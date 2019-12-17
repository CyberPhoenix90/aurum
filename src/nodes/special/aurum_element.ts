import { ArrayDataSource, DataSource } from '../../stream/data_source';
import { CancellationToken } from '../../utilities/cancellation_token';
import { Callback, ClassType, DataDrain, MapLike, StringSource } from '../../utilities/common';
import { ownerSymbol } from '../../utilities/owner_symbol';
import { AurumTextElement } from './aurum_text';
import { EventEmitter } from '../../utilities/event_emitter';

export interface AurumElementProps {
	id?: StringSource;
	name?: StringSource;
	draggable?: StringSource;
	class?: ClassType;
	tabindex?: ClassType;
	style?: StringSource;
	title?: StringSource;
	role?: StringSource;
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

	onAttach?: Callback<AurumElement>;
	onDetach?: Callback<AurumElement>;
	onCreate?: Callback<AurumElement>;
	onDispose?: Callback<AurumElement>;
	template?: Template<any>;
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
	mousewheel: 'onMouseWheel'
};

/**
 * @internal
 */
const defaultProps: string[] = ['id', 'name', 'draggable', 'tabindex', 'style', 'role', 'contentEditable'];

export type ChildNode =
	| AurumElement
	| string
	| Promise<ChildNode>
	| DataSource<string>
	| DataSource<AurumElement>
	| DataSource<AurumElement[]>
	| ArrayDataSource<AurumElement>
	| ChildNode[];

export abstract class AurumElement {
	private onAttach?: Callback<AurumElement>;
	private onDetach?: Callback<AurumElement>;
	private onDispose?: Callback<AurumElement>;

	private children: Array<AurumElement | AurumFragment | AurumTextElement>;
	protected needAttach: boolean;

	protected cancellationToken: CancellationToken;

	public node: HTMLElement;

	public template: Template<any>;

	constructor(props: AurumElementProps, children: ChildNode[], domNodeName: string) {
		this.cancellationToken = new CancellationToken();
		this.node = this.create(domNodeName);
		this.children = [];

		if (props !== null) {
			this.onDispose = props.onDispose;
			if (props.onAttach) {
				this.onAttach = props.onAttach;
				this.needAttach = true;
			}
			this.onDetach = props.onDetach;

			this.template = props.template;
			this.initialize(props);
			props.onCreate?.(this);
		}
		if (children) {
			this.addChildren(children);
		}
	}

	private initialize(props: AurumElementProps) {
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
					this.node.addEventListener(key, (e: MouseEvent) => props[events[key]].update(e));
				} else if (typeof props[events[key]] === 'function') {
					this.node.addEventListener(key, (e: MouseEvent) => props[events[key]](e));
				}
			}
		}
	}

	protected render(): void {
		if (this.cancellationToken.isCanceled) {
			return;
		}

		let absoluteIndex: number = 0;
		for (let i = 0; i < this.children.length; i++, absoluteIndex++) {
			if (this.children[i] instanceof AurumFragment) {
				const fragment: AurumFragment = this.children[i] as AurumFragment;
				for (let j = 0; j < fragment.children.length; j++, absoluteIndex++) {
					this.renderChild(fragment.children[j], absoluteIndex);
				}
				absoluteIndex--;
			} else {
				this.renderChild(this.children[i] as AurumElement, absoluteIndex);
			}
		}
		while (this.node.childNodes.length > absoluteIndex) {
			const child = this.node.childNodes[this.node.childNodes.length - 1];
			this.node.removeChild(child);
			child[ownerSymbol].dispose();
		}
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

	protected assignStringSourceToAttribute(data: StringSource, key: string) {
		if (typeof data === 'string') {
			this.node.setAttribute(key, data);
		} else {
			if (data.value) {
				this.node.setAttribute(key, data.value);
			}
			data.unique(this.cancellationToken).listen((v) => (this.node as HTMLElement).setAttribute(key, v), this.cancellationToken);
		}
	}

	protected handleAttach(parent: AurumElement) {
		if (this.needAttach) {
			if (parent.isConnected()) {
				this.onAttach?.(this);
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
		if (!this.node.isConnected) {
			this.onDetach?.(this);
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
		} else if (data instanceof DataSource) {
			if (data.value) {
				if (Array.isArray(data.value)) {
					this.node.className = data.value.join(' ');
					data.unique(this.cancellationToken).listen(() => {
						(this.node as HTMLElement).className = (data.value as string[]).join(' ');
					}, this.cancellationToken);
				} else {
					this.node.className = data.value;
					data.unique(this.cancellationToken).listen(() => {
						(this.node as HTMLElement).className = data.value as string;
					}, this.cancellationToken);
				}
			}
			data.unique(this.cancellationToken).listen((v) => ((this.node as HTMLElement).className = v), this.cancellationToken);
		} else {
			const value: string = data.reduce<string>((p, c) => {
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
			for (const i of data) {
				if (i instanceof DataSource) {
					i.unique(this.cancellationToken).listen((v) => {
						const value: string = data.reduce<string>((p, c) => {
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
					}, this.cancellationToken);
				}
			}
		}
	}

	protected resolveStringSource(source: StringSource): string {
		if (typeof source === 'string') {
			return source;
		} else {
			return source.value;
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
		for (const child of node.children) {
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

		const nodeA = this.node.children[indexA];
		const nodeB = this.node.children[indexB];
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
		if (index >= this.node.childElementCount) {
			this.node.appendChild(node);
			node[ownerSymbol].handleAttach?.(this);
		} else {
			this.node.insertBefore(node, this.node.children[index]);
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
		if (Array.isArray(child)) {
			for (const subChild of child) {
				this.addChild(subChild);
			}
			return;
		}
		if (child instanceof Template) {
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
			child.then((value) => {
				result.addChildren([value]);
				this.render();
			});
			return result;
		} else if (child instanceof ArrayDataSource) {
			const result = new AurumFragment({ repeatModel: child });
			result.onChange.subscribe(() => this.render(), this.cancellationToken);
			return result;
		} else if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean' || typeof child === 'bigint') {
			return new AurumTextElement(child.toString());
		} else if (child instanceof DataSource) {
			const result = new AurumFragment({}, [child]);
			result.onChange.subscribe(() => this.render(), this.cancellationToken);
			return result;
		} else {
			throw new Error('Unsupported child type');
		}
	}

	public addChildAt(child: ChildNode, index: number): void {
		if (child instanceof Template) {
			return;
		}

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

	public dispose(): void {
		this.internalDispose(true);
	}

	private internalDispose(detach: boolean) {
		if (this.cancellationToken.isCanceled) {
			return;
		}
		this.cancellationToken.cancel();
		if (detach) {
			this.remove();
		}
		for (const child of this.node.childNodes) {
			if (child[ownerSymbol]) {
				child[ownerSymbol].dispose(false);
			}
		}
		delete this.node[ownerSymbol];
		delete this.node;
		this.onDispose?.(this);
	}
}

export interface TemplateProps<T> extends AurumElementProps {
	onAttach?(entity: Template<T>): void;
	onDetach?(entity: Template<T>): void;
	generator(model: T): AurumElement;
	ref?: string | number;
}

export class Template<T> extends AurumElement {
	public generate: (model: T) => AurumElement;
	ref: string | number;

	constructor(props: TemplateProps<T>, children: ChildNode[]) {
		super(props, children, 'template');
		this.ref = props.ref;
		this.generate = props.generator;
	}
}

/**
 * @internal
 */
export interface AurumFragmentProps {
	repeatModel?: ArrayDataSource<AurumElement>;
}

/**
 * @internal
 */
export class AurumFragment {
	public children: Array<AurumElement | AurumTextElement>;
	public onChange: EventEmitter<void>;
	private cancellationToken: CancellationToken;

	constructor(props: AurumFragmentProps, children?: ChildNode[]) {
		this.onChange = new EventEmitter();
		this.children = [];
		if (props.repeatModel) {
			this.handleRepeat(props.repeatModel);
		} else if (children) {
			this.addChildren(children);
		}
	}

	public addChildren(children: ChildNode[]) {
		for (const child of children) {
			if (child instanceof AurumElement) {
				this.children.push(child);
			} else if (child instanceof DataSource) {
				let sourceChild = undefined;
				const freshnessToken = { ts: undefined };
				child.unique(this.cancellationToken).listenAndRepeat((newValue) => {
					freshnessToken.ts = Date.now();
					if (Array.isArray(newValue)) {
						this.children.length = 0;
						this.onChange.fire();
						for (const newSubValue of newValue) {
							this.handleSourceChild(newSubValue, undefined, child, freshnessToken, freshnessToken.ts);
						}
					} else {
						sourceChild = this.handleSourceChild(newValue, sourceChild, child, freshnessToken, freshnessToken.ts);
					}
				});
			} else {
				throw new Error('case not yet implemented');
			}
		}
	}

	private handleSourceChild(newValue: any, sourceChild: any, child: ChildNode, freshnessToken: { ts: number }, timestamp: number) {
		if ((newValue === undefined || newValue === null) && sourceChild) {
			this.children.splice(this.children.indexOf(sourceChild), 1);
			sourceChild = undefined;
			this.onChange.fire();
		} else if (typeof newValue === 'string' || typeof newValue === 'bigint' || typeof newValue === 'number' || typeof newValue === 'boolean') {
			if (!sourceChild) {
				const textNode = new AurumTextElement(child as any);
				this.children.push(textNode);
				sourceChild = textNode;
				this.onChange.fire();
			} else if (sourceChild instanceof AurumElement) {
				const textNode = new AurumTextElement(child as any);
				this.children.splice(this.children.indexOf(sourceChild), 1, textNode);
				sourceChild = textNode;
				this.onChange.fire();
			}
		} else if (newValue instanceof AurumElement) {
			if (!sourceChild) {
				this.children.push(newValue);
				sourceChild = newValue;
				this.onChange.fire();
			} else if (sourceChild instanceof AurumTextElement || sourceChild !== newValue) {
				this.children.splice(this.children.indexOf(sourceChild), 1, newValue);
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
		}
		return sourceChild;
	}

	private handleRepeat(dataSource: ArrayDataSource<AurumElement>): void {
		dataSource.listenAndRepeat((change) => {
			switch (change.operationDetailed) {
				case 'replace':
					this.children[change.index] = change.items[0];
					break;
				case 'swap':
					const itemA = this.children[change.index];
					const itemB = this.children[change.index2];
					this.children[change.index2] = itemA;
					this.children[change.index] = itemB;
					break;
				case 'append':
					this.children = this.children.concat(change.items);
					break;
				case 'prepend':
					this.children.unshift(...change.items);
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
		});
	}

	public dispose() {
		if (this.cancellationToken.isCanceled) {
			return;
		}
		this.cancellationToken.cancel();
	}
}
