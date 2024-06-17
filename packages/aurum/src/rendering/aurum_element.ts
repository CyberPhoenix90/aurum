import { ArrayDataSource, CollectionChange, DataSource, ReadOnlyArrayDataSource, ReadOnlyDataSource } from '../stream/data_source.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { CancellationToken } from '../utilities/cancellation_token.js';
import { EventEmitter } from '../utilities/event_emitter.js';

export type AurumComponent<T> = (props: T, children: Renderable[], api: AurumComponentAPI) => Renderable;

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

type ResolvedRenderable =
    | AurumElement
    | HTMLElement
    | Text
    | string
    | number
    | AurumElementModel<any>
    | ReadOnlyDataSource<Renderable>
    | ReadOnlyArrayDataSource<Renderable>
    | DuplexDataSource<Renderable>;

export type Renderable = ResolvedRenderable | Promise<ResolvedRenderable>;

export type Rendered = AurumElement | HTMLElement | Text | SVGElement;

export interface ComponentLifeCycle {
    onAttach(): void;
    onDetach(): void;
}

export interface ComponentLifeCycleInternal extends ComponentLifeCycle {
    attach: EventEmitter<void>;
    detach: EventEmitter<void>;
}

export interface AurumComponentAPI {
    synchronizeLifeCycle(lifeCycle: ComponentLifeCycle): void;
    onAttach(cb: () => void): void;
    onDetach(cb: () => void): void;
    cancellationToken: CancellationToken;
    prerender(children: Renderable[], lifeCycle: ComponentLifeCycle): any[];
    prerender(child: Renderable, lifeCycle: ComponentLifeCycle): any;
}

export interface AurumElementModel<T> {
    [aurumElementModelIdentitiy]: boolean;
    props: T;
    name: string;
    isIntrinsic: boolean;
    children: Renderable[];
    factory(props: T, children: Renderable[], api: AurumComponentAPI): Renderable;
}

export function createLifeCycle(): ComponentLifeCycle {
    const lc = {
        attach: new EventEmitter<void>(),
        detach: new EventEmitter<void>(),
        onAttach() {
            lc.attach.fire();
        },
        onDetach() {
            lc.detach.fire();
        }
    } as ComponentLifeCycleInternal;

    return lc;
}

export abstract class AurumElement {
    public children: Rendered[];
    protected api: AurumComponentAPI;
    private static id: number = 1;

    protected contentStartMarker: Comment;
    protected contentEndMarker: Comment;
    protected hostNode: HTMLElement;
    protected lastStartIndex: number;
    protected lastEndIndex: number;
    protected disposed: boolean = false;

    constructor(dataSource: ArrayDataSource<any> | DataSource<any> | DuplexDataSource<any>, api: AurumComponentAPI) {
        this.children = [];
        this.api = api;
        this.api.onAttach(() => {
            if (!this.api.cancellationToken.isCancelled) {
                if (this.hostNode === undefined) {
                    throw new Error('illegal state: Attach fired but not actually attached');
                }
                this.render(dataSource);
            }
        });
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }

        if (this.hostNode.isConnected) {
            this.clearContent();
            this.contentStartMarker.remove();
            this.contentEndMarker.remove();
        }
        this.disposed = true;
    }

    public attachToDom(node: HTMLElement, index: number): void {
        if (this.hostNode) {
            throw new Error('Aurum Element is already attached');
        }
        const id = AurumElement.id++;

        this.hostNode = node;
        this.contentStartMarker = document.createComment('START Aurum Node ' + id);
        //@ts-ignore
        this.contentStartMarker.owner = this;
        this.contentEndMarker = document.createComment('END Aurum Node ' + id);
        if (index >= node.childNodes.length) {
            node.appendChild(this.contentStartMarker);
            node.appendChild(this.contentEndMarker);
        } else {
            node.insertBefore(this.contentStartMarker, node.childNodes[index]);
            node.insertBefore(this.contentEndMarker, node.childNodes[index + 1]);
        }
    }

    protected getStartIndex(): number {
        return this.getWorkIndex() - 1;
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

        return -1;
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

        return -1;
    }

    protected abstract render(dataSource: DataSource<any> | ArrayDataSource<any> | DuplexDataSource<any>): void;

    protected clearContent(): void {
        if (this.hostNode === undefined) {
            throw new Error('illegal state: Aurum element was not attched to anything');
        }

        let workIndex = this.getWorkIndex();
        while (this.hostNode.childNodes[workIndex] !== this.contentEndMarker) {
            if (!(this.hostNode.childNodes[workIndex] instanceof Comment)) {
                this.hostNode.removeChild(this.hostNode.childNodes[workIndex]);
            } else {
                //@ts-ignore
                if (this.hostNode.childNodes[workIndex].owner.disposed) {
                    break;
                }
                //@ts-ignore
                this.hostNode.childNodes[workIndex].owner.dispose();
            }
        }
    }

    protected updateDom(): void {
        const workIndex = this.getWorkIndex();
        let i: number;
        let offset: number = 0;
        for (i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child === undefined || child === null) {
                offset--;
                continue;
            }

            if (child === this.hostNode.childNodes[i + workIndex + offset]) {
                continue;
            }

            if (child instanceof AurumElement) {
                if (!child.hostNode) {
                    child.attachToDom(this.hostNode, i + workIndex + offset);
                }
                if (child.getStartIndex() === i + workIndex + offset) {
                    offset += child.getLastIndex() - i - offset - workIndex;
                } else {
                    let start = child.getStartIndex();
                    let end = child.getLastIndex();

                    for (let ptr = start, swapIteration = 0; ptr <= end; ptr++, swapIteration++) {
                        const itemA = this.hostNode.childNodes[i + workIndex + offset + swapIteration];
                        const itemB = this.hostNode.childNodes[ptr];
                        const parentA = itemA.parentNode;
                        const siblingA = itemA.nextSibling === itemB ? itemB : itemA.nextSibling;

                        itemB.parentNode.insertBefore(itemA, itemB);
                        parentA.insertBefore(itemB, siblingA);
                    }
                    offset += child.getLastIndex() - i - offset - workIndex;
                }
                continue;
            }

            if (
                this.hostNode.childNodes[i + workIndex + offset] !== this.contentEndMarker &&
                this.hostNode.childNodes[i + workIndex + offset] !== this.children[i] &&
                this.hostNode.childNodes[i + workIndex + offset] !== (this.children[i + 1] as SingularAurumElement)?.contentStartMarker
            ) {
                if (child instanceof HTMLElement || child instanceof Text || child instanceof SVGElement) {
                    this.hostNode.removeChild(this.hostNode.childNodes[i + workIndex + offset]);
                    if (this.hostNode.childNodes[i + workIndex + offset]) {
                        this.lastEndIndex++;
                        this.hostNode.insertBefore(child, this.hostNode.childNodes[i + workIndex + offset]);
                    } else {
                        this.lastEndIndex++;
                        this.hostNode.appendChild(child);
                    }
                } else {
                    throw invalidRenderableError(child);
                }
            } else {
                if (child instanceof HTMLElement || child instanceof Text || child instanceof SVGElement) {
                    if (this.hostNode.childNodes[i + workIndex + offset]) {
                        this.lastEndIndex++;
                        this.hostNode.insertBefore(child, this.hostNode.childNodes[i + workIndex + offset]);
                    } else {
                        this.lastEndIndex++;
                        this.hostNode.appendChild(child);
                    }
                } else {
                    throw invalidRenderableError(child);
                }
            }
        }
        while (this.hostNode.childNodes[i + workIndex + offset] !== this.contentEndMarker) {
            this.lastEndIndex--;
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

function invalidRenderableError(child: never) {
    return new Error(`Aurum was given an unsupported type to render "${
        (child as any)?.constructor?.name ?? typeof child
    }". This can happen if you pass a component function directly to Aurum instead of "rendering" it using JSX syntax or Aurum.factory
Example:
// Wrong
<div>
{LoginComponent}
</div>

vs

// Correct
<div>
<LoginComponent/>
</div>

or

// Correct
<div>
{Aurum.factory(LoginComponent, {})}
</div>`);
}

/**
 * @internal
 */
export function renderInternal<T extends Renderable | Renderable[]>(element: T, session: RenderSession, prerendering: boolean = false): any {
    if (element == undefined) {
        return undefined;
    }

    if (Array.isArray(element)) {
        const result = [];
        for (const item of element) {
            const rendered = renderInternal(item, session, prerendering);
            // Flatten the rendered content into a single array to avoid having to iterate over nested arrays later
            if (rendered !== undefined && rendered !== null) {
                if (Array.isArray(rendered)) {
                    result.push(...rendered);
                } else {
                    result.push(rendered);
                }
            }
        }
        return result;
    }

    if (!prerendering) {
        const type = typeof element;
        if (type === 'string') {
            return document.createTextNode(element as string) as any;
        } else if (type === 'number' || type === 'bigint' || type === 'boolean') {
            return document.createTextNode(element.toString()) as any;
        }

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
    }

    if (element[aurumElementModelIdentitiy]) {
        const model: AurumElementModel<any> = element as any as AurumElementModel<any>;
        let api: AurumComponentAPI;
        //Optimization: skip creating API for no props basic html nodes because they are by far the most frequent and this can yield a noticable performance increase
        if (!model.isIntrinsic || model.props) {
            api = createAPI(session);
        } else {
            api = {
                renderSession: session
            } as any;
        }
        let componentResult;
        if (model.isIntrinsic) {
            componentResult = model.factory(model.props, model.children, api);
        } else {
            componentResult = model.factory(model.props ?? {}, model.children, api);
        }
        return renderInternal(componentResult, session, prerendering);
    }
    // Unsupported types are returned as is in hope that a transclusion component will transform it into something compatible
    return element as any;
}

/**
 * @internal
 */
export function createAPI(session: RenderSession): AurumComponentAPI {
    let token: CancellationToken = undefined;
    const api = {
        renderSession: session,
        synchronizeLifeCycle(lifeCycle: ComponentLifeCycle): void {
            api.onAttach(() => lifeCycle.onAttach());
            api.onDetach(() => lifeCycle.onDetach());
        },
        onAttach: (cb) => {
            session.attachCalls.push(cb);
        },
        onDetach: (cb) => {
            if (!token) {
                token = new CancellationToken();
                session.tokens.push(token);
            }
            token.addCancellable(cb);
        },
        get cancellationToken() {
            if (!token) {
                token = new CancellationToken();
                session.tokens.push(token);
            }
            return token;
        },
        prerender(target: Renderable | Renderable[], lifeCycle: ComponentLifeCycle) {
            const lc = lifeCycle as ComponentLifeCycleInternal;
            const subSession = createRenderSession();
            const result = renderInternal(target, subSession, true);

            lc.attach.subscribeOnce(() => {
                subSession.attachCalls.forEach((cb) => cb());
            });

            lc.detach.subscribeOnce(() => {
                lc.attach.cancelAll();
                subSession.sessionToken.cancel();
            });
            return result;
        }
    };

    return api;
}

export class ArrayAurumElement extends AurumElement {
    private renderSessions: WeakMap<any, RenderSession>;
    private dataSource: ArrayDataSource<any>;

    constructor(dataSource: ArrayDataSource<any>, api: AurumComponentAPI) {
        super(dataSource, api);
        this.renderSessions = new WeakMap();
        this.dataSource = dataSource;
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }
        this.api.cancellationToken.cancel();
        for (const children of this.children) {
            this.renderSessions.get(children)?.sessionToken.cancel();
        }
        super.dispose();
    }

    public attachToDom(node: HTMLElement, index: number): void {
        super.attachToDom(node, index);
        //@ts-ignore
        this.contentStartMarker.dataSource = this.dataSource;
        //@ts-ignore
        this.contentEndMarker.dataSource = this.dataSource;
    }

    protected render(dataSource: ArrayDataSource<any>): void {
        dataSource.listenAndRepeat((n) => {
            if (!this.disposed) {
                this.handleNewContent(n);
            }
        }, this.api.cancellationToken);
    }

    private spliceChildren(index: number, amount: number, ...newItems: Rendered[]): void {
        let removed;
        if (newItems) {
            removed = this.children.splice(index, amount, ...newItems);
        } else {
            removed = this.children.splice(index, amount);
        }
        for (const item of removed) {
            this.renderSessions.get(item)?.sessionToken.cancel();
        }
    }

    private handleNewContent(change: CollectionChange<any>): void {
        if (this.hostNode === undefined) {
            throw new Error('illegal state: Aurum element was not attched to anything');
        }

        let optimized = false;
        const ac = [];
        switch (change.operationDetailed) {
            case 'merge':
                const source = change.previousState.slice();
                for (let i = 0; i < change.newState.length; i++) {
                    if (this.children.length <= i) {
                        const rendered = this.renderItem(change.newState[i], ac);
                        if (Array.isArray(rendered)) {
                            this.children.push(...rendered);
                        } else {
                            this.children.push(rendered);
                        }
                        source.push(change.newState[i]);
                    } else if (source[i] !== change.newState[i]) {
                        const index = source.indexOf(change.newState[i], i);
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
                            const rendered = this.renderItem(change.newState[i], ac);
                            if (Array.isArray(rendered)) {
                                this.spliceChildren(i, 0, ...rendered);
                            } else {
                                this.spliceChildren(i, 0, rendered);
                            }
                            source.splice(i, 0, change.newState[i]);
                        }
                    }
                }
                if (this.children.length > change.newState.length) {
                    this.spliceChildren(change.newState.length, this.children.length - change.newState.length);
                }
                break;
            case 'remove':
            case 'removeLeft':
            case 'removeRight':
                this.spliceChildren(flattenIndex(change.newState, change.index), flattenIndex(change.items, change.items.length));
                break;
            case 'append':
                let targetIndex = this.getLastIndex();
                optimized = true;
                for (const item of change.items) {
                    const rendered = this.renderItem(item, ac);
                    if (Array.isArray(rendered)) {
                        this.children = this.children.concat(rendered);

                        for (let i = 0; i <= rendered.length; i++) {
                            if (rendered[i]) {
                                if (rendered[i] instanceof AurumElement) {
                                    rendered[i].attachToDom(this.hostNode, targetIndex);
                                    this.lastEndIndex = this.getLastIndex();
                                    targetIndex = this.lastEndIndex;
                                } else {
                                    this.hostNode.insertBefore(rendered[i], this.hostNode.childNodes[targetIndex]);
                                    this.lastEndIndex++;
                                    targetIndex++;
                                }
                            }
                        }
                    } else {
                        this.children.push(rendered);
                        if (rendered) {
                            if (rendered instanceof AurumElement) {
                                rendered.attachToDom(this.hostNode, targetIndex);
                                this.lastEndIndex = this.getLastIndex();
                                targetIndex = this.lastEndIndex;
                            } else {
                                this.hostNode.insertBefore(rendered, this.hostNode.childNodes[targetIndex]);
                                this.lastEndIndex++;
                                targetIndex++;
                            }
                        }
                    }
                }
                break;
            case 'replace':
                const rendered = this.renderItem(change.items[0], ac);
                if (Array.isArray(rendered)) {
                    throw new Error('illegal state');
                } else {
                    this.children[change.index] = rendered;
                }
                break;
            case 'swap':
                const itemA = this.children[change.index];
                const itemB = this.children[change.index2];

                if ((itemA instanceof HTMLElement && itemB instanceof HTMLElement) || (itemA instanceof SVGElement && itemB instanceof SVGElement)) {
                    optimized = true;
                    if (itemA.parentElement === itemB.parentElement) {
                        if (itemA.nextSibling === itemB) {
                            itemB.parentNode.insertBefore(itemB, itemA);
                            this.children[change.index2] = itemA;
                            this.children[change.index] = itemB;
                            break;
                        }
                        if (itemB.nextSibling === itemA) {
                            itemB.parentNode.insertBefore(itemA, itemB);
                            this.children[change.index2] = itemA;
                            this.children[change.index] = itemB;
                            break;
                        }
                    }

                    const parentA = itemA.parentNode;
                    const siblingA = itemA.nextSibling === itemB ? itemB : itemA.nextSibling;

                    itemB.parentNode.insertBefore(itemA, itemB);
                    parentA.insertBefore(itemB, siblingA);
                }
                this.children[change.index2] = itemA;
                this.children[change.index] = itemB;
                break;
            case 'prepend':
                for (let i = change.items.length - 1; i >= 0; i--) {
                    const item = change.items[i];
                    const rendered = this.renderItem(item, ac);
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
                    const rendered = this.renderItem(item, ac);
                    if (Array.isArray(rendered)) {
                        throw new Error('illegal state');
                    } else {
                        this.children.splice(index, 0, rendered);
                        index += 1;
                    }
                }
                break;
            case 'clear':
                this.spliceChildren(0, this.children.length);
                this.renderSessions = new WeakMap();
                break;
            default:
                throw new Error(`DOM updates from ${change.operationDetailed} are not supported`);
        }
        if (!optimized) {
            this.updateDom();
        }
        for (const c of ac) {
            c();
        }
    }

    private renderItem(item: any, attachCalls: any[]) {
        if (item === null || item === undefined) {
            return;
        }

        const s = createRenderSession();
        const rendered = renderInternal(item, s);
        if (rendered === undefined || rendered === null) {
            return;
        }
        if (rendered instanceof AurumElement) {
            s.sessionToken.addCancellable(() => rendered.dispose());
        }
        this.renderSessions.set(rendered, s);
        attachCalls.push(...s.attachCalls);
        return rendered;
    }
}

function flattenIndex(source: any[], index: number) {
    let flatIndex = 0;
    for (let i = 0; i < index; i++) {
        if (Array.isArray(source[i])) {
            flatIndex += flattenIndex(source[i], source[i].length);
        } else {
            flatIndex++;
        }
    }

    return flatIndex;
}

export class SingularAurumElement extends AurumElement {
    private renderSession: RenderSession;
    private lastValue: any;
    private dataSource: DataSource<any> | DuplexDataSource<any>;

    constructor(dataSource: DataSource<any> | DuplexDataSource<any>, api: AurumComponentAPI) {
        super(dataSource, api);
        this.api.cancellationToken.addCancellable(() => this.renderSession?.sessionToken.cancel());
        this.dataSource = dataSource;
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }
        this.api.cancellationToken.cancel();
        super.dispose();
    }

    public attachToDom(node: HTMLElement, index: number): void {
        super.attachToDom(node, index);
        //@ts-ignore
        this.contentStartMarker.dataSource = this.dataSource;
        //@ts-ignore
        this.contentEndMarker.dataSource = this.dataSource;
    }

    protected render(dataSource: DataSource<any> | DuplexDataSource<any>): void {
        dataSource.listenAndRepeat((n) => {
            if (!this.disposed) {
                this.handleNewContent(n);
            }
        }, this.api.cancellationToken);
    }

    private handleNewContent(newValue: any): void {
        if (this.lastValue === newValue) {
            return;
        }
        let optimized = false;
        if (this.children.length === 1 && this.children[0] instanceof Text) {
            const type = typeof newValue;
            if (type === 'string' || type === 'bigint' || type === 'number' || type === 'boolean') {
                this.children[0].nodeValue = newValue;
                optimized = true;
            }
        }
        if (!optimized) {
            this.fullRebuild(newValue);
            this.updateDom();
            for (const cb of this.renderSession.attachCalls) {
                cb();
            }
        }

        this.lastValue = newValue;
    }

    private fullRebuild(newValue: any): void {
        this.clearContent();
        this.endSession();
        this.renderSession = createRenderSession();
        let rendered = renderInternal(newValue, this.renderSession);
        if (rendered === undefined) {
            this.children = [];
            return;
        }

        if (!Array.isArray(rendered)) {
            rendered = [rendered];
        }
        for (const item of rendered) {
            if (item instanceof AurumElement) {
                this.renderSession.sessionToken.addCancellable(() => {
                    item.dispose();
                });
            }
        }

        if (Array.isArray(rendered)) {
            this.children = rendered;
        }
    }

    private endSession(): void {
        if (this.renderSession) {
            this.renderSession.sessionToken.cancel();
            this.renderSession = undefined;
        }
    }
}
