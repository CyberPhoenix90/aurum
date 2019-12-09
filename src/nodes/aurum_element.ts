import { DataSource, ArrayDataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { DataDrain, StringSource, ClassType, Callback, MapLike } from '../utilities/common';
import { ownerSymbol } from '../utilities/owner_symbol';
import { AurumTextElement } from './aurum_text';

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

	repeatModel?: ArrayDataSource<any> | any[];

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

//@ts-ignore
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

const defaultProps: string[] = ['id', 'name', 'draggable', 'tabindex', 'style', 'role', 'contentEditable'];

export type ChildNode = AurumElement | string | DataSource<string>;

export abstract class AurumElement {
	private onAttach?: Callback<AurumElement>;
	private onDetach?: Callback<AurumElement>;
	private onDispose?: Callback<AurumElement>;

	private children: AurumElement[];
	protected needAttach: boolean;

	protected cancellationToken: CancellationToken;
	protected repeatData: ArrayDataSource<any>;

	public node: HTMLElement;

	public template: Template<any>;

	constructor(props: AurumElementProps, domNodeName: string) {
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
	}

	private initialize(props: AurumElementProps) {
		this.createEventHandlers(defaultEvents, props);

		const dataProps = Object.keys(props).filter((e) => e.includes('-'));
		this.bindProps(defaultProps, props, dataProps);

		if (props.class) {
			this.handleClass(props.class);
		}

		if (props.repeatModel) {
			this.handleRepeat(props.repeatModel);
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
				const eventName = props[events[key]];
				if (props[eventName] instanceof DataSource) {
					this.node.addEventListener(key, (e: MouseEvent) => props[eventName].update(e));
				} else if (typeof props[eventName] === 'function') {
					this.node.addEventListener(key, (e: MouseEvent) => props[eventName](e));
				}
			}
		}
	}

	private handleRepeat(dataSource: ArrayDataSource<any> | any[]): void {
		if (dataSource instanceof ArrayDataSource) {
			this.repeatData = dataSource;
		} else {
			this.repeatData = new ArrayDataSource<any>(dataSource);
		}

		this.repeatData.listenAndRepeat((change) => {
			switch (change.operationDetailed) {
				case 'swap':
					const itemA = this.children[change.index];
					const itemB = this.children[change.index2];
					this.children[change.index2] = itemA;
					this.children[change.index] = itemB;
					break;
				case 'append':
					const old = this.children;
					this.children = new Array(old.length);
					let i = 0;
					for (i = 0; i < old.length; i++) {
						this.children[i] = old[i];
					}
					for (let index = 0; index < change.items.length; index++) {
						this.children[i + index] = this.template.generate(change.items[index]);
					}
					break;
				case 'prepend':
					this.children.unshift(...change.items.map((i) => this.template.generate(i)));
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
			this.render();
		});
	}

	protected render(): void {
		if (this.cancellationToken.isCanceled) {
			return;
		}

		for (let i = 0; i < this.children.length; i++) {
			if (this.node.childNodes.length <= i) {
				for (let n = i; n < this.children.length; n++) {
					this.addChildDom(this.children[n]);
				}
				return;
			}
			if (this.node.childNodes[i][ownerSymbol] !== this.children[i]) {
				if (!this.children.includes(this.node.childNodes[i][ownerSymbol] as AurumElement)) {
					const child = this.node.childNodes[i];
					child.remove();
					child[ownerSymbol].dispose();
					i--;
					continue;
				}

				const index = this.getChildIndex(this.children[i].node);
				if (index !== -1) {
					this.swapChildrenDom(i, index);
				} else {
					this.addDomNodeAt(this.children[i].node, i);
				}
			}
		}
		while (this.node.childNodes.length > this.children.length) {
			const child = this.node.childNodes[this.node.childNodes.length - 1];
			this.node.removeChild(child);
			child[ownerSymbol].dispose();
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
					child[ownerSymbol].handleAttach?.(this);
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

	protected getChildIndex(node: HTMLElement | Text): number {
		let i = 0;
		for (const child of node.childNodes) {
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

	public addChild(child: ChildNode) {
		if (child instanceof Template) {
			return;
		}
		child = this.childNodeToAurum(child);

		this.children.push(child);
		this.render();
	}

	private childNodeToAurum(child: ChildNode): AurumElement {
		if (typeof child === 'string' || child instanceof DataSource) {
			child = new AurumTextElement(child) as any;
		} else if (!(child instanceof AurumElement)) {
			child = new AurumTextElement((child as any).toString()) as any;
		}
		return child as any;
	}

	public addChildAt(child: ChildNode, index: number) {
		if (child instanceof Template) {
			return;
		}

		child = this.childNodeToAurum(child);
		this.children.splice(index, 0, child);
		this.render();
	}

	public addChildren(nodes: ChildNode[]) {
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
	ref?: string;
}

export class Template<T> extends AurumElement {
	public generate: (model: T) => AurumElement;
	ref: string;

	constructor(props: TemplateProps<T>) {
		super(props, 'template');
		this.ref = props.ref;
		this.generate = props.generator;
	}
}
