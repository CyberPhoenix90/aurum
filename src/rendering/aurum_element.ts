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
	style(fragments: TemplateStringsArray, ...input: any[]);
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
	protected hostNode: HTMLElement;
	private lastStartIndex: number;
	private lastEndIndex: number;

	constructor(dataSource: ArrayDataSource<any> | DataSource<any> | DuplexDataSource<any>, api: AurumComponentAPI) {
		this.children = [];
		this.api = api;
		this.api.onAttach(() => {
			if (this.hostNode === undefined) {
				throw new Error('illegal state: Attach fired but not actually attached');
			}
			this.render(dataSource);
		});
	}

	public dispose() {
		this.clearContent();
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

	protected getWorkIndex(): number {
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

	protected getLastIndex(): number {
		if (this.lastEndIndex !== undefined && this.hostNode.childNodes[this.lastEndIndex] === this.contentEndMarker) {
			return this.lastEndIndex;
		}

		for (let i = 0; i < this.hostNode.childNodes.length; i++) {
			if (this.hostNode.childNodes[i] === this.contentEndMarker) {
				this.lastEndIndex = i;
				return i;
			}
		}
	}

	protected abstract render(dataSource: DataSource<any> | ArrayDataSource<any> | DuplexDataSource<any>): void;

	protected clearContent(): void {
		if (this.hostNode === undefined) {
			throw new Error('illegal state: Aurum element was not attched to anything');
		}
		const workIndex = this.getWorkIndex();
		while (this.hostNode.childNodes[workIndex] !== this.contentEndMarker) {
			this.hostNode.removeChild(this.hostNode.childNodes[workIndex]);
		}
	}

	protected updateDom(): void {
		if (this.hostNode === undefined) {
			throw new Error('illegal state: Aurum element was not attched to anything');
		}

		const workIndex = this.getWorkIndex();
		let i: number;
		let offset: number = 0;
		for (i = 0; i < this.children.length; i++) {
			const child = this.children[i];
			if (child instanceof AurumElement) {
				offset += child.getLastIndex() - i - offset - workIndex;
				continue;
			}

			if (
				this.hostNode.childNodes[i + workIndex + offset] !== this.contentEndMarker &&
				this.hostNode.childNodes[i + workIndex + offset] !== this.children[i]
			) {
				if (child instanceof HTMLElement || child instanceof Text) {
					this.hostNode.removeChild(this.hostNode.childNodes[i + workIndex + offset]);
					if (this.hostNode.childNodes[i + workIndex + offset]) {
						this.hostNode.insertBefore(child, this.hostNode.childNodes[i + workIndex + offset]);
					} else {
						this.hostNode.appendChild(child);
					}
				} else {
					throw new Error('not implemented');
				}
			} else {
				if (child instanceof HTMLElement || child instanceof Text) {
					if (this.hostNode.childNodes[i + workIndex + offset]) {
						this.hostNode.insertBefore(child, this.hostNode.childNodes[i + workIndex + offset]);
					} else {
						this.hostNode.appendChild(child);
					}
				} else {
					throw new Error('not implemented');
				}
			}
		}
		while (this.hostNode.childNodes[i + workIndex + offset] !== this.contentEndMarker) {
			this.hostNode.removeChild(this.hostNode.childNodes[i + workIndex + offset]);
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
export function render<T extends Renderable>(element: T, session: RenderSession, prerendering: boolean = false): T extends Array<any> ? any[] : any {
	if (element == undefined) {
		return undefined;
	}

	if (pendingSessions.has(element)) {
		const subSession = pendingSessions.get(element);
		if (subSession.sessionToken) {
			session.attachCalls.push(...subSession.attachCalls);
			session.sessionToken.chain(subSession.sessionToken);
			subSession.attachCalls = undefined;
			subSession.sessionToken = undefined;
		}
		pendingSessions.delete(element);
	}

	if (Array.isArray(element)) {
		// Flatten the rendered content into a single array to avoid having to iterate over nested arrays later
		return Array.prototype.concat.apply(
			[],
			element.map((e) => render(e, session, prerendering))
		);
	}

	if (!prerendering) {
		if (element instanceof Promise) {
			const ds = new DataSource();
			element.then((val) => {
				ds.update(val);
			});
			const result = new SingularAurumElement(ds, createAPI(session));
			return result as any;
		} else if (element instanceof DataSource || element instanceof DuplexDataSource) {
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
	}

	if (element[aurumElementModelIdentitiy]) {
		const model: AurumElementModel<any> = (element as any) as AurumElementModel<any>;
		return render(model.factory(model.props || {}, model.children, createAPI(session)), session, prerendering);
	}
	// Unsupported types are returned as is in hope that a transclusion component will transform it into something compatible
	return element as any;
}

export const pendingSessions: WeakMap<any, RenderSession> = new WeakMap();

/**
 * @internal
 */
export function createAPI(session: RenderSession): AurumComponentAPI {
	let token: CancellationToken = undefined;
	const api = {
		renderSession: session,
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
			const subSession = createRenderSession();
			const result = render(target, subSession, true);
			if (Array.isArray(result)) {
				for (const item of result) {
					if (typeof item === 'object') {
						pendingSessions.set(item, subSession);
					}
				}
			} else {
				pendingSessions.set(result, subSession);
			}
			return result;
		},
		get style() {
			return function aurumStyle(fragments: TemplateStringsArray, ...input: any[]): DataSource<string> {
				const result = new DataSource<string>();
				for (const ins of input) {
					if (ins instanceof DataSource || ins instanceof DuplexDataSource) {
						ins.listen(() => result.update(recompute(fragments, input)), api.cancellationToken);
					}
				}

				result.update(recompute(fragments, input));

				return result;
			};
		}
	};

	return api;
}

function recompute(fragments: TemplateStringsArray, input: any[]) {
	let result = '';
	for (let i = 0; i < fragments.length; i++) {
		result += fragments[i];
		if (input[i]) {
			if (typeof input[i] === 'string') {
				result += input[i];
			} else {
				result += input[i].value;
			}
		}
	}

	return result;
}

export class ArrayAurumElement extends AurumElement {
	private renderSessions: WeakMap<any, RenderSession>;

	constructor(dataSource: ArrayDataSource<any>, api: AurumComponentAPI) {
		super(dataSource, api);
		this.renderSessions = new WeakMap();
	}

	protected render(dataSource: ArrayDataSource<any>): void {
		dataSource.listenAndRepeat((n) => {
			this.handleNewContent(n);
			this.updateDom();
		}, this.api.cancellationToken);
	}

	private spliceChildren(index: number, amount: number, newItems?: Rendered): void {
		let removed;
		if (newItems) {
			removed = this.children.splice(index, amount, newItems);
		} else {
			removed = this.children.splice(index, amount);
		}
		for (const item of removed) {
			this.renderSessions.get(item).sessionToken.cancel();
		}
	}

	private handleNewContent(change: CollectionChange<any>): void {
		switch (change.operationDetailed) {
			case 'merge':
				const source = change.previousState.slice();
				for (let i = 0; i < change.newState.length; i++) {
					if (this.children.length <= i) {
						this.children.push(this.renderItem(change.newState[i]));
					}
					if (source[i] !== change.newState[i]) {
						const index = source.indexOf(change.newState[i]);
						if (index !== -1) {
							const a = this.children[i];
							const b = this.children[index];
							this.children[i] = b;
							this.children[index] = a;
							const c = source[i];
							const d = source[index];
							source[i] = d;
							source[index] = c;
						} else {
							this.spliceChildren(i, 0, this.renderItem(change.newState[i]));
							source.splice(i, 0, change.newState[i]);
						}
					}
				}
				if (this.children.length > change.newState.length) {
					this.children.length = change.newState.length;
				}
				break;
			case 'remove':
			case 'removeLeft':
			case 'removeRight':
				this.spliceChildren(change.index, change.count);
				break;
			case 'append':
				for (const item of change.items) {
					const rendered = this.renderItem(item);
					if (Array.isArray(rendered)) {
						this.children = this.children.concat(rendered);
					} else {
						this.children.push(rendered);
					}
				}
				break;
			case 'replace':
				const rendered = this.renderItem(change.items[0]);
				if (Array.isArray(rendered)) {
					throw new Error('illegal state');
				} else {
					this.children[change.index] = rendered;
				}
				break;
			case 'swap':
				const itemA = this.children[change.index];
				const itemB = this.children[change.index2];
				this.children[change.index2] = itemA;
				this.children[change.index] = itemB;
				break;
			case 'prepend':
				for (const item of change.items) {
					const rendered = this.renderItem(item);
					if (Array.isArray(rendered)) {
						throw new Error('illegal state');
					} else {
						this.children.unshift(rendered);
					}
				}
				break;
			case 'insert':
				let index = change.index;
				for (const item of change.items) {
					const rendered = this.renderItem(item);
					if (Array.isArray(rendered)) {
						throw new Error('illegal state');
					} else {
						this.children.splice(index, 0, rendered);
						index += 1;
					}
				}
				break;
			case 'remove':
				for (const item of change.items) {
					const rendered = this.renderItem(item);
					if (Array.isArray(rendered)) {
						throw new Error('illegal state');
					} else {
						this.children.unshift(rendered);
					}
				}
				break;
			case 'clear':
				this.children.length = 0;
				this.renderSessions = new WeakMap();
				break;
			default:
				throw new Error('not implemented');
		}
		this.updateDom();
	}

	private renderItem(item: any) {
		const s = createRenderSession();
		console.log('NEW SESSION');
		const rendered = render(item, s);
		for (const cb of s.attachCalls) {
			cb();
		}
		this.renderSessions.set(rendered, s);
		return rendered;
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
		let optimized = false;
		if (this.children.length === 1 && this.children[0] instanceof Text) {
			const type = typeof newValue;
			if (type === 'string' || type === 'bigint' || type === 'number') {
				this.children[0].nodeValue = newValue;
				optimized = true;
			}
		}
		if (!optimized) {
			this.fullRebuild(newValue);
		}

		this.lastValue = newValue;
	}

	private fullRebuild(newValue: any): void {
		this.clearContent();
		this.endSession();
		this.renderSession = createRenderSession();
		console.log('NEW SESSION');
		let rendered = render(newValue, this.renderSession);
		if (rendered === undefined) {
			this.children = [];
			return;
		}

		if (!Array.isArray(rendered)) {
			rendered = [rendered];
		}
		for (const item of rendered) {
			if (item instanceof AurumElement) {
				item.attachToDom(this.hostNode, this.getLastIndex());
			}
		}

		for (const cb of this.renderSession.attachCalls) {
			cb();
		}
		if (Array.isArray(rendered)) {
			this.children = rendered;
		}
	}

	private endSession(): void {
		if (this.renderSession) {
			console.log('END SESSION');
			this.renderSession.sessionToken.cancel();
			this.renderSession = undefined;
		}
	}
}
