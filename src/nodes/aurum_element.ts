import { DataSource, ArrayDataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { DataDrain, StringSource, ClassType, Callback } from '../utilities/common';
import { ownerSymbol } from '../utilities/owner_symbol';

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

export type ChildNode = AurumElement | string | DataSource<string>;

export abstract class AurumElement {
	private onAttach?: Callback<AurumElement>;
	private onDetach?: Callback<AurumElement>;
	private onDispose?: Callback<AurumElement>;

	private rerenderPending: boolean;
	private children: AurumElement[];

	protected cancellationToken: CancellationToken;
	protected repeatData: ArrayDataSource<any>;

	public readonly node: HTMLElement | Text;
	public readonly domNodeName: string;

	public template: Template<any>;
	public onClick: DataSource<MouseEvent>;
	public onKeydown: DataSource<KeyboardEvent>;
	public onKeyup: DataSource<KeyboardEvent>;
	public onMousedown: DataSource<KeyboardEvent>;
	public onMouseup: DataSource<KeyboardEvent>;
	public onMouseenter: DataSource<KeyboardEvent>;
	public onMouseleave: DataSource<KeyboardEvent>;
	public onFocus: DataSource<FocusEvent>;
	public onBlur: DataSource<FocusEvent>;
	public onDrag: DataSource<DragEvent>;
	public onDragend: DataSource<DragEvent>;
	public onDragenter: DataSource<DragEvent>;
	public onDragexit: DataSource<DragEvent>;
	public onDragleave: DataSource<DragEvent>;
	public onDragover: DataSource<DragEvent>;
	public onDragstart: DataSource<DragEvent>;

	constructor(props: AurumElementProps, domNodeName: string) {
		this.onDispose = props.onDispose;
		this.onAttach = props.onAttach;
		this.onDetach = props.onDetach;

		this.domNodeName = domNodeName;
		this.template = props.template;
		this.cancellationToken = new CancellationToken();
		this.node = this.create(props);
		this.initialize(props);
		props.onCreate?.(this);
	}

	private initialize(props: AurumElementProps) {
		if (!(this.node instanceof Text)) {
			this.children = [];
		}

		this.createEventHandlers(
			[
				'drag',
				'name',
				'dragstart',
				'dragend',
				'dragexit',
				'dragover',
				'dragenter',
				'dragleave',
				'blur',
				'focus',
				'click',
				'dblclick',
				'keydown',
				'keyhit',
				'keyup',
				'mousedown',
				'mouseup',
				'mouseenter',
				'mouseleave',
				'mousewheel'
			],
			props
		);

		const dataProps = Object.keys(props).filter((e) => e.startsWith('x-') || e.startsWith('data-'));
		this.bindProps(['id', 'draggable', 'tabindex', 'style', 'role', 'contentEditable', ...dataProps], props);

		if (props.class) {
			this.handleClass(props.class);
		}

		if (props.repeatModel) {
			this.handleRepeat(props.repeatModel);
		}
	}

	protected bindProps(keys: string[], props: any) {
		for (const key of keys) {
			if (props[key]) {
				this.assignStringSourceToAttribute(props[key], key);
			}
		}
	}

	protected createEventHandlers(keys: string[], props: any) {
		if (this.node instanceof Text) {
			return;
		}

		for (const key of keys) {
			const computedEventName = 'on' + key[0].toUpperCase() + key.slice(1);

			let eventEmitter;
			Object.defineProperty(this, computedEventName, {
				get() {
					if (!eventEmitter) {
						eventEmitter = new DataSource();
					}
					return eventEmitter;
				},
				set() {
					throw new Error(computedEventName + ' is read only');
				}
			});

			if (props[computedEventName]) {
				if (props[computedEventName] instanceof DataSource) {
					this[computedEventName].listen(props[computedEventName].update.bind(props.onClick), this.cancellationToken);
				} else if (typeof props[computedEventName] === 'function') {
					this[computedEventName].listen(props[computedEventName], this.cancellationToken);
				}
			}
			this.cancellationToken.registerDomEvent(this.node, key, (e: MouseEvent) => this[computedEventName].update(e));
		}
	}

	private handleRepeat(dataSource: ArrayDataSource<any> | any[]): void {
		if (dataSource instanceof ArrayDataSource) {
			this.repeatData = dataSource;
		} else {
			this.repeatData = new ArrayDataSource<any>(dataSource);
		}

		if (this.repeatData.length) {
			this.children.push(...(this.repeatData as ArrayDataSource<any>).toArray().map((i) => this.template.generate(i)));
			this.render();
		}

		this.repeatData.onChange.subscribe((change) => {
			switch (change.operation) {
				case 'swap':
					const itemA = this.children[change.index];
					const itemB = this.children[change.index2];
					this.children[change.index2] = itemA;
					this.children[change.index] = itemB;
					break;
				case 'append':
					this.children.push(...change.items.map((i) => this.template.generate(i)));
					break;
				case 'prepend':
					this.children.unshift(...change.items.map((i) => this.template.generate(i)));
					break;
				case 'remove':
					this.children.splice(change.index, change.count);
					break;
				default:
					this.children.length = 0;
					this.children.push(...(this.repeatData as ArrayDataSource<any>).toArray().map((i) => this.template.generate(i)));
					break;
			}
			this.render();
		});
	}

	protected render(): void {
		if (this.rerenderPending) {
			return;
		}

		if (this.node instanceof Text) {
			return;
		}

		setTimeout(() => {
			for (let i = 0; i < this.children.length; i++) {
				if (this.node.childNodes.length <= i) {
					this.addChildrenDom(this.children.slice(i, this.children.length));
					break;
				}
				if (this.node.childNodes[i][ownerSymbol] !== this.children[i]) {
					if (!this.children.includes(this.node.childNodes[i][ownerSymbol] as AurumElement)) {
						const child = this.node.childNodes[i];
						child.remove();
						child[ownerSymbol].handleDetach();
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
				child[ownerSymbol].handleDetach();
			}
			this.rerenderPending = false;
		});
		this.rerenderPending = true;
	}

	protected assignStringSourceToAttribute(data: StringSource, key: string) {
		if (this.node instanceof Text) {
			return;
		}

		if (typeof data === 'string') {
			this.node.setAttribute(key, data);
		} else {
			if (data.value) {
				this.node.setAttribute(key, data.value);
			}
			data.unique(this.cancellationToken).listen((v) => (this.node as HTMLElement).setAttribute(key, v), this.cancellationToken);
		}
	}

	private handleAttach() {
		this.onAttach?.(this);
		for (const child of this.node.childNodes) {
			child[ownerSymbol].handleAttach();
		}
	}

	//@ts-ignore
	private handleDetach() {
		this.onDetach?.(this);
		for (const child of this.node.childNodes) {
			child[ownerSymbol].handleDetach();
		}
	}

	private handleClass(data: ClassType) {
		if (this.node instanceof Text) {
			return;
		}

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

	protected create(props: AurumElementProps): HTMLElement | Text {
		const node = document.createElement(this.domNodeName);
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
		if (this.node instanceof Text) {
			throw new Error("Text nodes don't have children");
		}

		for (const child of node.children) {
			if (child === node) {
				return true;
			}
		}
		return false;
	}

	protected addChildrenDom(children: AurumElement[]): void {
		if (this.node instanceof Text) {
			throw new Error("Text nodes don't have children");
		}

		for (const child of children) {
			this.node.appendChild(child.node);
			child.handleAttach();
		}
	}

	protected swapChildrenDom(indexA: number, indexB: number) {
		if (this.node instanceof Text) {
			throw new Error("Text nodes don't have children");
		}

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
		if (this.node instanceof Text) {
			throw new Error("Text nodes don't have children");
		}

		if (index >= this.node.childElementCount) {
			this.node.appendChild(node);
			node[ownerSymbol].handleAttach();
		} else {
			this.node.insertBefore(node, this.node.children[index]);
			node[ownerSymbol].handleAttach();
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
		if (this.node instanceof Text) {
			throw new Error("Text nodes don't have children");
		}

		this.children.length = 0;
		this.render();
	}

	public addChild(child: ChildNode) {
		if (this.node instanceof Text) {
			throw new Error("Text nodes don't have children");
		}

		if (child instanceof Template) {
			return;
		}
		child = this.childNodeToAurum(child);

		this.children.push(child);
		this.render();
	}

	private childNodeToAurum(child: ChildNode): AurumElement {
		if (typeof child === 'string' || child instanceof DataSource) {
			child = new TextNode({
				text: child
			});
		} else if (!(child instanceof AurumElement)) {
			child = new TextNode({
				text: (child as any).toString()
			});
		}
		return child;
	}

	public addChildAt(child: ChildNode, index: number) {
		if (this.node instanceof Text) {
			throw new Error("Text nodes don't have children");
		}

		if (child instanceof Template) {
			return;
		}

		child = this.childNodeToAurum(child);
		this.children.splice(index, 0, child);
		this.render();
	}

	public addChildren(nodes: ChildNode[]) {
		if (this.node instanceof Text) {
			throw new Error("Text nodes don't have children");
		}

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
		this.cancellationToken.cancel();
		if (detach) {
			this.remove();
		}
		for (const child of this.node.childNodes) {
			if (child[ownerSymbol]) {
				child[ownerSymbol].internalDispose(false);
			}
		}
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

interface TextNodeProps extends AurumElementProps {
	onAttach?: (node: TextNode) => void;
	onDetach?: (node: TextNode) => void;
	text?: StringSource;
}

export class TextNode extends AurumElement {
	constructor(props: TextNodeProps) {
		super(props, 'textNode');
		if (props.text instanceof DataSource) {
			props.text.listen((v) => (this.node.textContent = v), this.cancellationToken);
		}
	}

	protected create(props: TextNodeProps): HTMLElement | Text {
		const node = document.createTextNode(this.resolveStringSource(props.text));
		node[ownerSymbol] = this;
		return node;
	}
}
