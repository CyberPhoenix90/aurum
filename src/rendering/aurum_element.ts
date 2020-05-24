import { DataSource, ArrayDataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { render } from './renderer';
import { createRenderSession } from '../utilities/aurum';

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
	onAttach(cb: () => void);
	onDetach(cb: () => void);
	onError(cb: (error: Error) => Renderable);
	cancellationToken: CancellationToken;
	prerender(children: Renderable[], disposalToken?: CancellationToken): any[];
	prerender(child: Renderable, disposalToken?: CancellationToken): any;
}

export interface AurumElementModel<T> {
	[aurumElementModelIdentitiy]: boolean;
	props: T;
	children: Renderable[];
	factory(props: T, children: Renderable[], api: AurumComponentAPI): Renderable;
}

export class AurumElement {
	public children: Rendered[];
	private contentStartMarker: Comment;
	private contentEndMarker: Comment;
	private hostNode: HTMLElement;
	public lifetimeToken: CancellationToken;

	constructor(dataSource: ArrayDataSource<any> | DataSource<any> | DuplexDataSource<any>, api: AurumComponentAPI) {
		this.children = [];
		this.lifetimeToken = new CancellationToken();

		if (dataSource instanceof DataSource) {
			dataSource.listenAndRepeat((n) => {
				const rendered = render(n, createRenderSession());
				if (Array.isArray(rendered)) {
					this.updateChildren(rendered);
				} else {
					this.updateChildren([rendered]);
				}
			});
		}
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
		this.contentStartMarker = document.createComment('START');
		this.contentEndMarker = document.createComment('END');
		node.appendChild(this.contentStartMarker);
		node.appendChild(this.contentEndMarker);
		if (this.children.length > 0) {
			this.render();
		}
	}

	private getWorkIndex(): number {
		for (let i = 0; i < this.hostNode.childNodes.length; i++) {
			if (this.hostNode.childNodes[i] === this.contentStartMarker) {
				return i + 1;
			}
		}
	}

	private render(): void {
		const workIndex = this.getWorkIndex();
		let i;
		for (i = 0; i < this.children.length; i++) {
			const child = this.children[i];
			if (this.hostNode.childNodes[i + workIndex] !== this.contentEndMarker && this.hostNode.childNodes[i + workIndex] !== this.children[i]) {
				if (child instanceof HTMLElement || child instanceof Text) {
					this.hostNode.removeChild(this.hostNode.childNodes[i + workIndex]);
					if (this.hostNode.childNodes[i + workIndex]) {
						this.hostNode.insertBefore(child, this.hostNode.childNodes[i + workIndex]);
					} else {
						this.hostNode.appendChild(child);
					}
				} else {
					throw new Error('not implemented');
				}
			} else {
				if (child instanceof HTMLElement || child instanceof Text) {
					if (this.hostNode.childNodes[i + workIndex]) {
						this.hostNode.insertBefore(child, this.hostNode.childNodes[i + workIndex]);
					} else {
						this.hostNode.appendChild(child);
					}
				} else {
					throw new Error('not implemented');
				}
			}
		}
		while (this.hostNode.childNodes[i + workIndex] !== this.contentEndMarker) {
			this.hostNode.removeChild(this.hostNode.childNodes[i + workIndex]);
		}
	}
}
