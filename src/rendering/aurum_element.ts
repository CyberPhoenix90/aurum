import { DataSource, ArrayDataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';

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
	onAttach(cb: (rootNode?: Rendered) => void);
	onDetach(cb: (rootNode?: Rendered) => void);
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
	private parentNode: HTMLElement;

	constructor() {
		this.children = [];
	}

	public updateChildren(newChildren: Rendered[]): void {
		this.children = newChildren;
	}

	public attachToDom(node: HTMLElement, index: number, aurumSiblings: AurumElement[]): void {
		if (this.parentNode) {
			throw new Error('Aurum Element is already attached');
		}

		this.parentNode = node;
		if (this.children.length > 0) {
			this.render();
		}
	}

	private render(): void {}
}
