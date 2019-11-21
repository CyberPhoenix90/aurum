import { DataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { DataDrain, StringSource, ClassType } from '../utilities/common';
import { ArrayDataSource } from '../stream/array_data_source';
import { ownerSymbol } from '../utilities/owner_symbol';

export interface AurumElementProps {
	id?: StringSource;
	draggable?: StringSource;
	class?: ClassType;
	tabindex?: ClassType;
	style?: StringSource;
	title?: StringSource;

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

	onAttach?: (node: AurumElement) => void;
	template?: Template<any>;
}

export abstract class AurumElement {
	protected cancellationToken: CancellationToken;
	private cachedChildren: AurumElement[];
	protected repeatData: ArrayDataSource<any>;
	private rerenderPending: boolean;

	public readonly node: HTMLElement;
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
		this.domNodeName = domNodeName;
		this.template = props.template;
		this.cancellationToken = new CancellationToken();
		this.node = this.create(props);
		this.initialize(props);
		if (props.onAttach) {
			props.onAttach(this);
		}
	}

	private initialize(props: AurumElementProps) {
		//@ts-ignore
		this.node.owner = this;

		this.createEventHandlers(
			[
				'drag',
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
				'mousedown, mouseup',
				'mouseenter',
				'mouseleave',
				'mousewheel'
			],
			props
		);
		this.bindProps(['id', 'draggable', 'tabindex', 'style'], props);

		if (props.class) {
			this.handleClass(props.class);
		}

		if (props.repeatModel) {
			this.cachedChildren = [];
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
			this.cachedChildren.push(...(this.repeatData as ArrayDataSource<any>).toArray().map((i) => this.template.generate(i)));
			this.renderRepeat();
		}

		this.repeatData.onChange.subscribe((change) => {
			switch (change.operation) {
				case 'swap':
					const itemA = this.cachedChildren[change.index];
					const itemB = this.cachedChildren[change.index2];
					this.cachedChildren[change.index2] = itemA;
					this.cachedChildren[change.index] = itemB;
					break;
				case 'append':
					this.cachedChildren.push(...change.items.map((i) => this.template.generate(i)));
					break;
				case 'remove':
					this.cachedChildren.splice(change.index, change.count);
					break;
				default:
					this.cachedChildren.length = 0;
					this.cachedChildren.push(...(this.repeatData as ArrayDataSource<any>).toArray().map((i) => this.template.generate(i)));
					break;
			}
			this.renderRepeat();
		});
	}

	protected renderRepeat(): void {
		if (this.rerenderPending) {
			return;
		}

		setTimeout(() => {
			for (let i = 0; i < this.cachedChildren.length; i++) {
				if (this.node.childElementCount <= i) {
					this.addChildren(this.cachedChildren.slice(i, this.cachedChildren.length));
					break;
				}
				if (((this.node.children[i] as any).owner as AurumElement) !== this.cachedChildren[i]) {
					if (!this.cachedChildren.includes((this.node.children[i] as any).owner as AurumElement)) {
						this.node.children[i][ownerSymbol].remove();
						i--;
						continue;
					}

					const index = this.getChildIndex(this.cachedChildren[i].node);
					if (index !== -1) {
						this.swapChildren(i, index);
					} else {
						this.addChildAt(this.cachedChildren[i], i);
					}
				}
			}
			while (this.node.childElementCount > this.cachedChildren.length) {
				this.node[ownerSymbol].removeChild(this.node.lastChild[ownerSymbol]);
			}
			// this.onUpdate.fire(this);
			this.rerenderPending = false;
		});
		this.rerenderPending = true;
	}

	protected assignStringSourceToAttribute(data: StringSource, key: string) {
		if (typeof data === 'string') {
			this.node.setAttribute(key, data);
		} else {
			if (data.value) {
				this.node.setAttribute(key, data.value);
			}
			data.unique(this.cancellationToken).listen((v) => this.node.setAttribute(key, v), this.cancellationToken);
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
						this.node.className = (data.value as string[]).join(' ');
					}, this.cancellationToken);
				} else {
					this.node.className = data.value;
					data.unique(this.cancellationToken).listen(() => {
						this.node.className = data.value as string;
					}, this.cancellationToken);
				}
			}
			data.unique(this.cancellationToken).listen((v) => (this.node.className = v), this.cancellationToken);
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
						this.node.className = value;
					}, this.cancellationToken);
				}
			}
		}
	}

	public create(props: AurumElementProps): HTMLElement {
		const node = document.createElement(this.domNodeName);
		node[ownerSymbol] = this;
		return node;
	}

	protected getChildIndex(node: HTMLElement): number {
		let i = 0;
		for (const child of node.children) {
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

	public setInnerText(value: string) {
		if (this.node.firstChild instanceof HTMLElement) {
			throw new Error('Cannot combine text and child nodes into a single element');
		}

		this.node.innerText = value;
	}

	public swapChildren(indexA: number, indexB: number) {
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

	protected addDomNodeAt(node: HTMLElement, index: number) {
		if (index >= this.node.childElementCount) {
			this.node.appendChild(node);
		} else {
			this.node.insertBefore(node, this.node.children[index]);
		}
	}

	public remove(): void {
		if (this.hasParent()) {
			this.node.parentElement.removeChild(this.node);
			this.dispose();
		}
	}

	public hasParent(): boolean {
		return !!this.node.parentElement;
	}

	public isConnected(): boolean {
		return this.node.isConnected;
	}

	public removeChild(child: AurumElement): void {
		child.dispose();
		this.node.removeChild(child.node);
	}

	public removeChildAt(index: number): void {
		const childNode = this.node.childNodes[index];
		if (childNode) {
			const child = childNode[ownerSymbol];
			child.dispose();
			this.node.removeChild(child.node);
		}
	}

	public clearChildren(): void {
		while (this.node.firstChild) {
			const owner: AurumElement = this.node.firstChild[ownerSymbol];
			owner.dispose();
			this.node.removeChild(this.node.firstChild);
		}
	}

	public addChild(child: AurumElement) {
		if (child.node instanceof Template) {
			return;
		}

		return this.node.appendChild(child.node);
	}

	public addChildAt(child: AurumElement, index: number) {
		if (child.node instanceof Template) {
			return;
		}

		return this.addDomNodeAt(child.node, index);
	}

	public addChildren(nodes: AurumElement[]) {
		if (nodes.length === 0) {
			return;
		}

		let dataSegments: Array<string | DataSource<any>> = [];
		for (const c of nodes) {
			if (c instanceof Template) {
				continue;
			}
			if (typeof c === 'string') {
				dataSegments.push(c);
			} else if (c instanceof DataSource) {
				dataSegments.push(c);
				this.setInnerText(c.value);
				c.listen((v) => {
					const value: string = dataSegments.reduce<string>((p, c) => p + (c instanceof DataSource ? (c.value ?? '').toString() : c), '');
					this.setInnerText(value);
				}, this.cancellationToken);
			} else {
				this.node.appendChild(c.node);
			}
		}
		if (dataSegments.length) {
			const value: string = dataSegments.reduce<string>((p, c) => p + (c instanceof DataSource ? (c.value ?? '').toString() : c), '');
			this.setInnerText(value);
		}
	}

	public dispose(): void {
		this.cancellationToken.cancel();
		for (const child of this.node.childNodes) {
			if (child[ownerSymbol]) {
				child[ownerSymbol].dispose();
			}
		}
		this.remove();
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
