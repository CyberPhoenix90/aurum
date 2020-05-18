import { DataSource, ArrayDataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
import { CancellationToken } from '../utilities/cancellation_token';

export const aurumElementModelIdentitiy = Symbol('AurumElementModel');

export const nodeData = new WeakMap<any, AurumNodeData>();

export interface AurumNodeData {}

export type Renderable =
	| AurumElement
	| HTMLElement
	| Text
	| string
	| number
	| BigInt
	| AurumElementModel<any>
	| Promise<Renderable>
	| DataSource<Renderable>
	| ArrayDataSource<Renderable>
	| DuplexDataSource<Renderable>
	| Renderable[];

export type Rendered = AurumElement | HTMLElement | Text;

export interface AurumComponentAPI {
	onAttach(cb: (element: AurumElement) => void);
	onDetach(cb: () => void);
	onError(cb: (error: Error) => Renderable);
}

export interface AurumElementModel<T> {
	[aurumElementModelIdentitiy]: boolean;
	props: T;
	children: Renderable[];
	factory(props: T, children: Renderable[], api: AurumComponentAPI): Renderable;
}

export class AurumElement {
	private children: Rendered[];
	private hostNode: HTMLElement;
	public lifetimeToken: CancellationToken;
	private onAttach: (element: AurumElement) => void;

	constructor(props: { onAttach?: (element: AurumElement) => void } = {}) {
		this.children = [];
		this.onAttach = props.onAttach;
		this.lifetimeToken = new CancellationToken();
	}

	public updateChildren(newChildren: Rendered[]): void {
		this.children = newChildren;
		if (this.hostNode && this.children.length > 0) {
			this.render();
		}
	}

	public attachToDom(node: HTMLElement, index: number, aurumSiblings: AurumElement[]): void {
		if (this.hostNode) {
			throw new Error('Aurum Element is already attached');
		}

		this.hostNode = node;
		this.onAttach?.(this);
		if (this.children.length > 0) {
			this.render();
		}
	}

	private render(): void {
		for (const child of this.children) {
			if (child instanceof HTMLElement || child instanceof Text) {
				this.hostNode.appendChild(child);
			}
		}
	}
}
