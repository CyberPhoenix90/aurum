import { DataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { DataDrain } from '../utilities/common';
import { Template } from './template';
import { ArrayDataSource } from '../stream/array_data_source';

export type StringSource = string | DataSource<string>;
export type ClassType = string | DataSource<string> | DataSource<string[]> | Array<string | DataSource<string>>;

export interface AurumElementProps {
	id?: StringSource;
	class?: ClassType;
	repeatModel?: ArrayDataSource<any> | any[];

	onClick?: DataDrain<MouseEvent>;
	onKeydown?: DataDrain<KeyboardEvent>;
	onKeyup?: DataDrain<KeyboardEvent>;
	onMousedown?: DataDrain<KeyboardEvent>;
	onMouseup?: DataDrain<KeyboardEvent>;
	onMouseenter?: DataDrain<KeyboardEvent>;
	onMouseleave?: DataDrain<KeyboardEvent>;

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

	private initialize(props: AurumElementProps) {
		//@ts-ignore
		this.node.owner = this;

		this.createEventHandlers(['click', 'keydown', 'keyhit', 'keyup', 'mousedown, mouseup', 'mouseenter', 'mouseleave'], props);

		if (props.id) {
			this.assignStringSourceToAttribute(props.id, 'id');
		}
		if (props.class) {
			this.handleClass(props.class);
		}

		if (props.repeatModel) {
			this.cachedChildren = [];
			this.handleRepeat(props.repeatModel);
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
				case 'append':
					this.cachedChildren.push(...change.items.map((i) => this.template.generate(i)));
					break;
				case 'removeLeft':
					this.cachedChildren.splice(0, change.count);
					break;
				case 'removeRight':
					this.cachedChildren.splice(this.node.childElementCount - change.count, change.count);
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
						this.node.children[i].remove();
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
				this.node.removeChild(this.node.lastChild);
			}
			// this.onUpdate.fire(this);
			this.rerenderPending = false;
		});
		this.rerenderPending = true;
	}

	protected assignStringSourceToAttribute(data: StringSource, key: string) {
		if (typeof data === 'string') {
			this.node[key] = data;
		} else {
			if (data.value) {
				this.node[key] = data.value;
			}
			data.unique(this.cancellationToken).listen((v) => (this.node.id = v), this.cancellationToken);
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

	public addChildAt(child: AurumElement, index: number) {
		if (child instanceof Template) {
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
}
