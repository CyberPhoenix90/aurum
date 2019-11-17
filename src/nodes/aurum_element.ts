import { DataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { DataDrain } from '../utilities/common';
import { Template } from './template';

export type StringSource = string | DataSource<string>;
export type ClassType = string | DataSource<string> | DataSource<string[]> | Array<string | DataSource<string>>;

export interface AurumElementProps {
	id?: StringSource;
	class?: ClassType;
	onClick?: DataDrain<MouseEvent>;
	onAttach?: (node: AurumElement) => void;
}

export abstract class AurumElement {
	public node: HTMLElement;
	protected cancellationToken: CancellationToken;
	public onClick: DataSource<MouseEvent>;

	constructor(props: AurumElementProps) {
		this.cancellationToken = new CancellationToken();
		this.node = this.create(props);

		this.handleProps(props);

		//@ts-ignore
		this.node.owner = this;
		if (props.onAttach) {
			props.onAttach(this);
		}
	}

	private handleProps(props: AurumElementProps) {
		this.onClick = new DataSource();

		if (props.onClick) {
			if (props.onClick instanceof DataSource) {
				this.onClick.listen(props.onClick.update.bind(props.onClick), this.cancellationToken);
			} else {
				this.onClick.listen(props.onClick, this.cancellationToken);
			}
		}
		this.cancellationToken.registerDomEvent(this.node, 'click', (e: MouseEvent) => this.onClick.update(e));

		if (props.id) {
			this.handleStringSource(props.id, 'id');
		}
		if (props.class) {
			this.handleClass(props.class);
		}
	}

	protected handleStringSource(data: StringSource, key: string) {
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

	public abstract create(props: AurumElementProps): HTMLElement;

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
					const value: string = dataSegments.reduce<string>(
						(p, c) => p + (c instanceof DataSource ? (c.value ?? '').toString() : c),
						''
					);
					this.setInnerText(value);
				}, this.cancellationToken);
			} else {
				this.node.appendChild(c.node);
			}
		}
		if (dataSegments.length) {
			const value: string = dataSegments.reduce<string>(
				(p, c) => p + (c instanceof DataSource ? (c.value ?? '').toString() : c),
				''
			);
			this.setInnerText(value);
		}
	}
}
