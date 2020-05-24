import { DataSource, ArrayDataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
import { CancellationToken } from '../utilities/cancellation_token';

export function createRenderSession(): RenderSession {
	return {
		attachCalls: [],
		sessionToken: new CancellationToken(),
		tokens: []
	};
}

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
	private api: AurumComponentAPI;
	private renderSession: RenderSession;

	constructor(dataSource: ArrayDataSource<any> | DataSource<any> | DuplexDataSource<any>, api: AurumComponentAPI) {
		this.children = [];
		this.api = api;
		this.api.onAttach(() => {
			this.render(dataSource);
		});
		this.api.cancellationToken.addCancelable(() => this.renderSession?.sessionToken.cancel());
	}

	public attachToDom(node: HTMLElement, index: number): void {
		if (this.hostNode) {
			throw new Error('Aurum Element is already attached');
		}

		this.hostNode = node;
		this.contentStartMarker = document.createComment('START');
		this.contentEndMarker = document.createComment('END');
		if (index >= node.childNodes.length) {
			node.appendChild(this.contentStartMarker);
			node.appendChild(this.contentEndMarker);
		} else {
			node.insertBefore(this.contentStartMarker, node.childNodes[index]);
			node.insertBefore(this.contentEndMarker, node.childNodes[index + 1]);
		}
	}

	private getWorkIndex(): number {
		for (let i = 0; i < this.hostNode.childNodes.length; i++) {
			if (this.hostNode.childNodes[i] === this.contentStartMarker) {
				return i + 1;
			}
		}
	}

	private render(dataSource: DataSource<any> | ArrayDataSource<any> | DuplexDataSource<any>): void {
		if (dataSource instanceof DataSource) {
			dataSource.listenAndRepeat((n) => {
				const rendered = render(n, createRenderSession());
				if (Array.isArray(rendered)) {
					this.children = rendered;
				} else {
					this.children = [rendered];
				}
				this.updateDom();
			});
		}
	}

	private updateDom() {
		const workIndex = this.getWorkIndex();
		let i: number;
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

/**
 * @internal
 */
export interface RenderSession {
	attachCalls: Array<() => void>;
	tokens: CancellationToken[];
	sessionToken: CancellationToken;
}

/**
 * @internal
 */
export function render<T extends Renderable>(element: T, session: RenderSession): T extends Array<any> ? any[] : any {
	if (element == undefined) {
		return undefined;
	}

	if (Array.isArray(element)) {
		// Flatten the rendered content into a single array to avoid having to iterate over nested arrays later
		return Array.prototype.concat.apply(
			[],
			element.map((e) => render(e, session))
		);
	}

	if (element instanceof DataSource || element instanceof DuplexDataSource || element instanceof ArrayDataSource) {
		const result = new AurumElement(element as any, createAPI(session));

		return result as any;
	}

	const type = typeof element;
	if (type === 'string' || type === 'number' || type === 'bigint') {
		return document.createTextNode(element.toString()) as any;
	}

	if (element[aurumElementModelIdentitiy]) {
		const model: AurumElementModel<any> = (element as any) as AurumElementModel<any>;
		return render(model.factory(model.props || {}, model.children, createAPI(session)), session);
	}
	// Unsupported types are returned as is in hope that a transclusion component will transform it into something compatible
	return element as any;
}

/**
 * @internal
 */
export function createAPI(session: RenderSession): AurumComponentAPI {
	let token: CancellationToken = undefined;
	return {
		onAttach: (cb) => {
			session.attachCalls.push(cb);
		},
		onDetach: (cb) => {
			if (!token) {
				token = new CancellationToken();
				session.tokens.push(token);
			}
			token.addCancelable(cb);
		},
		onError: (cb) => {
			throw new Error('not implemented');
		},
		get cancellationToken() {
			if (!token) {
				token = new CancellationToken();
				session.tokens.push(token);
			}
			return token;
		},
		prerender(target: Renderable | Renderable[]) {
			return render(target, session);
		}
	};
}
