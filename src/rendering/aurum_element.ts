import { DataSource, ArrayDataSource, CollectionChange } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
import { CancellationToken } from '../utilities/cancellation_token';

export function createRenderSession(): RenderSession {
	const session = {
		attachCalls: [],
		sessionToken: new CancellationToken(() => {
			for (const token of session.tokens) {
				token.cancel();
			}
		}),
		tokens: []
	};

	return session;
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

export abstract class AurumElement {
	public children: Rendered[];
	protected api: AurumComponentAPI;

	private contentStartMarker: Comment;
	private contentEndMarker: Comment;
	private hostNode: HTMLElement;
	private lastStartIndex: number;

	constructor(dataSource: ArrayDataSource<any> | DataSource<any> | DuplexDataSource<any>, api: AurumComponentAPI) {
		this.children = [];
		this.api = api;
		this.api.onAttach(() => {
			this.render(dataSource);
		});
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
		if (this.lastStartIndex !== undefined && this.hostNode.childNodes[this.lastStartIndex] === this.contentStartMarker) {
			return this.lastStartIndex + 1;
		}

		for (let i = 0; i < this.hostNode.childNodes.length; i++) {
			if (this.hostNode.childNodes[i] === this.contentStartMarker) {
				this.lastStartIndex = i;
				return i + 1;
			}
		}
	}

	protected abstract render(dataSource: DataSource<any> | ArrayDataSource<any> | DuplexDataSource<any>): void;

	protected updateDom() {
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

	if (element instanceof DataSource || element instanceof DuplexDataSource) {
		const result = new SingularAurumElement(element as any, createAPI(session));
		return result as any;
	} else if (element instanceof ArrayDataSource) {
		const result = new ArrayAurumElement(element as any, createAPI(session));
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

export class ArrayAurumElement extends AurumElement {
	constructor(dataSource: ArrayDataSource<any>, api: AurumComponentAPI) {
		super(dataSource, api);
	}

	protected render(dataSource: ArrayDataSource<any>): void {
		dataSource.listenAndRepeat((n) => {
			this.handleNewContent(n);
			this.updateDom();
		}, this.api.cancellationToken);
	}

	private handleNewContent(newValue: CollectionChange<any>): void {
		switch (newValue.operationDetailed) {
			case 'append':
				const s = createRenderSession();
				console.log('NEW SESSION');
				const rendered = render(newValue.items, s);
				for (const cb of s.attachCalls) {
					cb();
				}
				if (Array.isArray(rendered)) {
					this.children = rendered;
				} else {
					this.children = [rendered];
				}
		}
		this.updateDom();
	}
}

export class SingularAurumElement extends AurumElement {
	private renderSession: RenderSession;
	private lastValue: any;

	constructor(dataSource: DataSource<any> | DuplexDataSource<any>, api: AurumComponentAPI) {
		super(dataSource, api);
		this.api.cancellationToken.addCancelable(() => this.renderSession?.sessionToken.cancel());
	}

	protected render(dataSource: DataSource<any> | DuplexDataSource<any>): void {
		dataSource.listenAndRepeat((n) => {
			this.handleNewContent(n);
			this.updateDom();
		}, this.api.cancellationToken);
	}

	private handleNewContent(newValue: any): void {
		if (this.lastValue === newValue) {
			return;
		}
		if (this.children.length === 1 && this.children[0] instanceof Text && typeof this.lastValue === typeof newValue) {
			this.children[0].nodeValue = newValue;
		} else {
			this.endSession();
			this.renderSession = createRenderSession();
			console.log('NEW SESSION');
			const rendered = render(newValue, this.renderSession);
			for (const cb of this.renderSession.attachCalls) {
				cb();
			}
			if (Array.isArray(rendered)) {
				this.children = rendered;
			} else {
				this.children = [rendered];
			}
		}

		this.lastValue = newValue;
	}

	private endSession(): void {
		if (this.renderSession) {
			console.log('END SESSION');
			this.renderSession.sessionToken.cancel();
			this.renderSession = undefined;
		}
	}
}
