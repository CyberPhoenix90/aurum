import { ArrayDataSource, CollectionChange, CollectionItemIdentity, DataSource } from '@aurum/streams';
import {
    AurumComponentAPI,
    AurumElementModel,
    aurumElementModelIdentitiy,
    createAPI as createCoreAPI,
    createRenderSession,
    isAurumDevtoolsDebugBuild,
    registerAurumRenderBinding,
    Renderable,
    RenderSession,
    traceAurumComponentRender
} from '@aurum/rendering';
import { listenToRenderBatchState, queueRenderUpdate } from './render_batch.js';

export type Rendered = AurumElement | HTMLElement | Text | SVGElement;
type DOMRenderInput = Renderable | Rendered | DOMRenderInput[];
const aurumElementDomBounds = new WeakMap<AurumElement, readonly [Comment, Comment]>();

export abstract class AurumElement {
    public children: Rendered[];
    protected api: AurumComponentAPI<DOMPrerendered>;
    protected renderScope: RenderSession;
    private static id: number = 1;

    protected contentStartMarker: Comment;
    protected contentEndMarker: Comment;
    protected hostNode: HTMLElement;
    protected lastStartIndex: number;
    protected lastEndIndex: number;
    protected disposed: boolean = false;

    constructor(dataSource: ArrayDataSource<DOMRenderInput> | DataSource<DOMRenderInput> | undefined, api: AurumComponentAPI<DOMPrerendered>) {
        this.children = [];
        this.api = api;
        if (isAurumDevtoolsDebugBuild()) {
            this.renderScope = createRenderSession(api.renderSession);
            this.api.cancellationToken.addCancellable(this.renderScope.sessionToken);
        } else {
            this.renderScope = api.renderSession;
        }
        this.api.cancellationToken.addCancellable(() => this.dispose());
        if (dataSource) {
            this.api.onAttach(() => {
                if (!this.api.cancellationToken.isCancelled) {
                    if (this.hostNode === undefined) {
                        throw new Error('illegal state: Attach fired but not actually attached');
                    }
                    this.render(dataSource);
                }
            });
        }
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }

        if (this.hostNode?.isConnected) {
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
        aurumElementDomBounds.set(this, [this.contentStartMarker, this.contentEndMarker]);
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

    protected abstract render(dataSource: DataSource<DOMRenderInput> | ArrayDataSource<DOMRenderInput>): void;

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
        if (
            this.hostNode.childNodes[workIndex] === this.contentEndMarker &&
            this.children.length > 0 &&
            this.children.every((child) => child instanceof HTMLElement || child instanceof Text || child instanceof SVGElement)
        ) {
            const fragment = document.createDocumentFragment();
            for (const child of this.children) fragment.appendChild(child as Node);
            const endIndex = this.getLastIndex();
            this.hostNode.insertBefore(fragment, this.contentEndMarker);
            this.lastEndIndex = endIndex + this.children.length;
            return;
        }
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

function invalidRenderableError(child: never) {
    return new Error(`Aurum was given an unsupported type to render "${
        (child as unknown as { constructor?: { name?: string } })?.constructor?.name ?? typeof child
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
export function renderInternal(element: DOMRenderInput, session: RenderSession, prerendering?: false): Rendered | Rendered[] | undefined;
export function renderInternal(element: DOMRenderInput, session: RenderSession, prerendering: true): DOMPrerendered | DOMPrerendered[];
export function renderInternal(element: DOMRenderInput, session: RenderSession, prerendering: boolean): DOMRenderInput;
export function renderInternal(element: DOMRenderInput, session: RenderSession, prerendering: boolean = false): DOMRenderInput {
    if (element == undefined) {
        return undefined;
    }

    if (Array.isArray(element)) {
        const result: DOMRenderInput[] = [];
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
            return document.createTextNode(element as string);
        } else if (type === 'number' || type === 'bigint' || type === 'boolean') {
            return document.createTextNode(element.toString());
        }

        if (element instanceof Promise) {
            const ds = new DataSource<Renderable>();
            element.then((val) => {
                ds.update(val);
            });
            return new SingularAurumElement(ds, createDOMAPI(session));
        } else if (element instanceof DataSource) {
            return new SingularAurumElement(element, createDOMAPI(session));
        } else if (element instanceof ArrayDataSource) {
            return new ArrayAurumElement(element, createDOMAPI(session));
        }
    }

    if ((element as AurumElementModel<any>)[aurumElementModelIdentitiy]) {
        const model: AurumElementModel<any> = element as any as AurumElementModel<any>;
        if (model.isIntrinsic) {
            // Optimization: skip creating API for no-props basic HTML nodes because they are by far the most frequent.
            const api = model.props
                ? (createDOMAPI(session) as AurumComponentAPI)
                : ({ renderSession: session } as AurumComponentAPI);
            return renderInternal(model.factory(model.props, model.children, api), session, prerendering);
        }
        return traceAurumComponentRender(model, session, () => {
            const api = createDOMAPI(session) as AurumComponentAPI;
            return renderInternal(model.factory(model.props ?? {}, model.children, api), session, prerendering);
        });
    }
    // Unsupported types are returned as is in hope that a transclusion component will transform it into something compatible
    return element;
}

export type DOMPrerendered = Renderable | Rendered;

/** @internal Creates a component API whose prerender output belongs to the DOM host. */
export function createDOMAPI(session: RenderSession): AurumComponentAPI<DOMPrerendered> {
    return createCoreAPI<DOMPrerendered>(session, (target, subSession) => renderInternal(target, subSession, true));
}

interface ArrayRenderEntry {
    identity: CollectionItemIdentity;
    sourceValue: unknown;
    rendered: Rendered;
    session?: RenderSession;
}

export class ArrayAurumElement extends AurumElement {
    private static readonly immediateContentCommit = ArrayAurumElement.prototype.handleNewContent;
    private entries: ArrayRenderEntry[] = [];
    private dataSource: ArrayDataSource<DOMRenderInput>;
    private readonly batchedContentCommit = (change: CollectionChange<DOMRenderInput>): void => {
        if (!this.disposed) this.handleBatchedContent(change);
    };

    constructor(dataSource: ArrayDataSource<DOMRenderInput>, api: AurumComponentAPI<DOMPrerendered>) {
        super(dataSource, api);
        this.dataSource = dataSource;
        registerAurumRenderBinding(dataSource, this, 'DOM collection', api.cancellationToken, api.renderSession);
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }
        this.api.cancellationToken.cancel();
        if (this.disposed) return;
        for (const entry of this.entries) {
            entry.session?.sessionToken.cancel();
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

    protected render(dataSource: ArrayDataSource<DOMRenderInput>): void {
        dataSource.listenAndRepeat((n) => {
            if (!this.disposed) {
                this.handleNewContent(n);
            }
        }, this.api.cancellationToken);
    }

    private queueBatchedContent(change: CollectionChange<DOMRenderInput>): void {
        queueRenderUpdate(this, this.batchedContentCommit, change);
    }

    public static setRenderBatching(active: boolean): void {
        ArrayAurumElement.prototype.handleNewContent = active
            ? ArrayAurumElement.prototype.queueBatchedContent
            : ArrayAurumElement.immediateContentCommit;
    }

    private handleBatchedContent(change: CollectionChange<DOMRenderInput>): void {
        const batchedChange = {
            ...change,
            operation: 'merge',
            operationDetailed: 'merge',
            index: 0,
            items: change.newState
        } as CollectionChange<DOMRenderInput>;

        // Identity metadata is non-enumerable and therefore is not preserved by
        // the spread above. Carry the final identities into snapshot reconciliation.
        Object.defineProperty(batchedChange, 'newStateIdentities', {
            value: change.newStateIdentities,
            enumerable: false
        });

        ArrayAurumElement.immediateContentCommit.call(this, batchedChange);
    }

    private synchronizeChildren(): void {
        this.children = this.entries.map((entry) => entry.rendered);
    }

    private spliceEntries(index: number, amount: number, ...newEntries: ArrayRenderEntry[]): void {
        const removed = this.entries.splice(index, amount, ...newEntries);
        for (const entry of removed) entry.session?.sessionToken.cancel();
    }

    private removeEntriesFromDom(index: number, count: number): void {
        const removed = this.entries.splice(index, count);
        this.children.splice(index, count);
        this.detachEntriesFromDom(removed);
    }

    private detachEntriesFromDom(removed: readonly ArrayRenderEntry[]): void {
        for (const entry of removed) {
            if (!(entry.rendered instanceof AurumElement)) {
                entry.rendered.remove();
            }
            entry.session?.sessionToken.cancel();
        }
        this.lastEndIndex = undefined;
    }

    private insertEntryGapBefore(entries: readonly ArrayRenderEntry[], anchorIndex: number): void {
        if (entries.length === 0) return;

        const anchor = anchorIndex >= this.entries.length ? this.contentEndMarker : this.entries[anchorIndex].rendered;
        if (entries.every((entry) => !(entry.rendered instanceof AurumElement))) {
            const fragment = document.createDocumentFragment();
            for (const entry of entries) fragment.appendChild(entry.rendered as Node);
            const referenceNode =
                anchor instanceof AurumElement ? this.hostNode.childNodes[this.getEntryDomIndex(anchorIndex)] : (anchor as Node);
            this.hostNode.insertBefore(fragment, referenceNode);
            this.lastEndIndex = undefined;
            return;
        }

        const targetIndex = this.getEntryDomIndex(anchorIndex);
        for (let itemIndex = entries.length - 1; itemIndex >= 0; itemIndex--) {
            this.attachRendered(entries[itemIndex].rendered, targetIndex);
        }
    }

    private getEntryDomIndex(index: number): number {
        if (index === 0) return this.getWorkIndex();
        if (index >= this.entries.length) return this.getLastIndex();

        const rendered = this.entries[index].rendered;
        for (let domIndex = this.getWorkIndex(); domIndex < this.getLastIndex(); domIndex++) {
            const node = this.hostNode.childNodes[domIndex];
            if (node === rendered || (node as Comment & { owner?: AurumElement }).owner === rendered) return domIndex;
        }
        return this.getLastIndex();
    }

    private insertEntries(
        index: number,
        values: readonly DOMRenderInput[],
        identities: readonly CollectionItemIdentity[] | undefined,
        attachCalls: Array<() => void>
    ): void {
        const anchor = index >= this.entries.length ? this.contentEndMarker : this.entries[index].rendered;
        const referenceNode = anchor instanceof AurumElement ? undefined : (anchor as Node);
        const newEntries = values.map((value, itemIndex) => this.renderEntry(value, identities?.[itemIndex], attachCalls));
        // Ranges still require a numeric DOM position. Resolve it before changing
        // the entry array, but avoid the scan for the overwhelmingly common case
        // where both the inserted entries and their anchor are ordinary nodes.
        const targetIndex = newEntries.some((entry) => entry.rendered instanceof AurumElement)
            ? this.getEntryDomIndex(index)
            : undefined;
        this.entries.splice(index, 0, ...newEntries);
        this.children.splice(index, 0, ...newEntries.map((entry) => entry.rendered));

        if (newEntries.length > 0 && newEntries.every((entry) => !(entry.rendered instanceof AurumElement))) {
            const fragment = document.createDocumentFragment();
            for (const entry of newEntries) fragment.appendChild(entry.rendered as Node);
            this.hostNode.insertBefore(fragment, referenceNode ?? this.contentEndMarker);
            this.lastEndIndex = undefined;
            return;
        }

        // Insert before one stable anchor from right to left. This works for both
        // single DOM nodes and comment-bounded AurumElement ranges.
        for (let itemIndex = newEntries.length - 1; itemIndex >= 0; itemIndex--) {
            this.attachRendered(newEntries[itemIndex].rendered, targetIndex as number);
        }
    }

    private tryApplySubsequenceRemoval(desiredIdentities: readonly CollectionItemIdentity[]): boolean {
        if (desiredIdentities.length >= this.entries.length) return false;

        const removals: Array<{ index: number; count: number }> = [];
        const retainedEntries: ArrayRenderEntry[] = [];
        let desiredIndex = 0;
        let removalStart = -1;

        for (let entryIndex = 0; entryIndex < this.entries.length; entryIndex++) {
            if (
                desiredIndex < desiredIdentities.length &&
                this.entries[entryIndex].identity === desiredIdentities[desiredIndex]
            ) {
                if (removalStart !== -1) {
                    removals.push({ index: removalStart, count: entryIndex - removalStart });
                    removalStart = -1;
                }
                retainedEntries.push(this.entries[entryIndex]);
                desiredIndex++;
            } else if (removalStart === -1) {
                removalStart = entryIndex;
            }
        }

        if (desiredIndex !== desiredIdentities.length) return false;
        if (removalStart !== -1) removals.push({ index: removalStart, count: this.entries.length - removalStart });

        // The DOM groups are independent, so remove them without repeatedly
        // splicing the backing arrays (which becomes quadratic for a filter).
        for (const removal of removals) {
            this.detachEntriesFromDom(this.entries.slice(removal.index, removal.index + removal.count));
        }
        this.entries = retainedEntries;
        this.synchronizeChildren();
        return true;
    }

    private tryApplySubsequenceGrowth(
        desiredIdentities: readonly CollectionItemIdentity[],
        desiredValues: readonly DOMRenderInput[],
        attachCalls: Array<() => void>
    ): boolean {
        if (desiredIdentities.length <= this.entries.length) return false;

        const gaps: Array<{ valueIndex: number; end: number; entryIndex: number }> = [];
        let entryIndex = 0;
        let gapStart = -1;

        for (let desiredIndex = 0; desiredIndex < desiredIdentities.length; desiredIndex++) {
            if (
                entryIndex < this.entries.length &&
                desiredIdentities[desiredIndex] === this.entries[entryIndex].identity
            ) {
                if (gapStart !== -1) {
                    gaps.push({ valueIndex: gapStart, end: desiredIndex, entryIndex });
                    gapStart = -1;
                }
                entryIndex++;
            } else if (gapStart === -1) {
                gapStart = desiredIndex;
            }
        }

        if (entryIndex !== this.entries.length) return false;
        if (gapStart !== -1) gaps.push({ valueIndex: gapStart, end: desiredIdentities.length, entryIndex });

        const renderedGaps = gaps.map((gap) => ({
            ...gap,
            entries: desiredValues
                .slice(gap.valueIndex, gap.end)
                .map((value, index) => this.renderEntry(value, desiredIdentities[gap.valueIndex + index], attachCalls))
        }));

        // Insert from right to left against the unchanged retained-entry array.
        // This keeps every anchor stable and avoids thousands of array splices.
        for (let index = renderedGaps.length - 1; index >= 0; index--) {
            const gap = renderedGaps[index];
            this.insertEntryGapBefore(gap.entries, gap.entryIndex);
        }

        const desiredEntries: ArrayRenderEntry[] = [];
        let retainedStart = 0;
        for (const gap of renderedGaps) {
            desiredEntries.push(...this.entries.slice(retainedStart, gap.entryIndex), ...gap.entries);
            retainedStart = gap.entryIndex;
        }
        desiredEntries.push(...this.entries.slice(retainedStart));
        this.entries = desiredEntries;
        this.synchronizeChildren();

        // Each gap is committed as one fragment when its entries have a single
        // DOM root; retained nodes are never detached or moved.
        return true;
    }

    private tryApplySingleRotation(desiredIdentities: readonly CollectionItemIdentity[]): boolean {
        const length = this.entries.length;
        if (length < 2 || desiredIdentities.length !== length) return false;

        const first = this.entries[0];
        const firstRendered = first.rendered;
        if (desiredIdentities[length - 1] === first.identity) {
            let isLeftRotation = true;
            for (let index = 0; index < length - 1; index++) {
                if (desiredIdentities[index] !== this.entries[index + 1].identity) {
                    isLeftRotation = false;
                    break;
                }
            }
            if (isLeftRotation) {
                this.moveRenderedBefore(firstRendered, this.contentEndMarker);
                this.entries.push(this.entries.shift());
                this.children.push(this.children.shift());
                return true;
            }
        }

        const last = this.entries[length - 1];
        const lastRendered = last.rendered;
        if (desiredIdentities[0] === last.identity) {
            let isRightRotation = true;
            for (let index = 1; index < length; index++) {
                if (desiredIdentities[index] !== this.entries[index - 1].identity) {
                    isRightRotation = false;
                    break;
                }
            }
            if (isRightRotation) {
                this.moveRenderedBefore(lastRendered, this.firstDomNode(firstRendered));
                this.entries.unshift(this.entries.pop());
                this.children.unshift(this.children.pop());
                return true;
            }
        }

        return false;
    }

    private handleNewContent(change: CollectionChange<DOMRenderInput>): void {
        if (this.hostNode === undefined) {
            throw new Error('illegal state: Aurum element was not attched to anything');
        }

        let optimized = false;
        const attachCalls: Array<() => void> = [];
        switch (change.operationDetailed) {
            case 'merge': {
                const desiredIdentities = change.newStateIdentities ?? [];
                if (this.tryApplySingleRotation(desiredIdentities)) {
                    optimized = true;
                    break;
                }
                const sharedPrefixLength = Math.min(this.entries.length, desiredIdentities.length);
                let retainedPrefixLength = 0;
                while (
                    retainedPrefixLength < sharedPrefixLength &&
                    this.entries[retainedPrefixLength].identity === desiredIdentities[retainedPrefixLength]
                ) {
                    retainedPrefixLength++;
                }

                if (retainedPrefixLength === this.entries.length) {
                    if (change.newState.length > this.entries.length) {
                        this.insertEntries(
                            this.entries.length,
                            change.newState.slice(this.entries.length),
                            desiredIdentities.slice(this.entries.length),
                            attachCalls
                        );
                    }
                    optimized = true;
                    break;
                }
                if (retainedPrefixLength === change.newState.length) {
                    this.removeEntriesFromDom(change.newState.length, this.entries.length - change.newState.length);
                    optimized = true;
                    break;
                }
                if (this.tryApplySubsequenceRemoval(desiredIdentities)) {
                    optimized = true;
                    break;
                }
                if (this.tryApplySubsequenceGrowth(desiredIdentities, change.newState, attachCalls)) {
                    optimized = true;
                    break;
                }

                const entriesByIdentity = new Map(this.entries.map((entry) => [entry.identity, entry]));
                let createdEntry = false;
                const desiredEntries = change.newState.map((value, index) => {
                    const retainedEntry = entriesByIdentity.get(desiredIdentities[index]);
                    if (retainedEntry) return retainedEntry;
                    createdEntry = true;
                    return this.renderEntry(value, desiredIdentities[index], attachCalls);
                });
                if (createdEntry || desiredEntries.length !== this.entries.length) {
                    const retained = new Set(desiredEntries);
                    for (const entry of this.entries) {
                        if (!retained.has(entry)) entry.session?.sessionToken.cancel();
                    }
                }
                this.entries = desiredEntries;
                break;
            }
            case 'remove':
            case 'removeLeft':
                this.removeEntriesFromDom(change.index, change.items.length);
                optimized = true;
                break;
            case 'removeRight':
                this.spliceEntries(change.index, change.items.length);
                break;
            case 'append': {
                this.insertEntries(this.entries.length, change.items, change.itemIdentities, attachCalls);
                optimized = true;
                break;
            }
            case 'replace': {
                const oldEntry = this.entries[change.index];
                const newEntry = this.renderEntry(change.items[0], change.itemIdentities?.[0], attachCalls);
                if (!(oldEntry.rendered instanceof AurumElement) && !(newEntry.rendered instanceof AurumElement)) {
                    oldEntry.rendered.replaceWith(newEntry.rendered);
                    oldEntry.session?.sessionToken.cancel();
                    this.entries[change.index] = newEntry;
                    this.children[change.index] = newEntry.rendered;
                } else {
                    const targetIndex = this.getEntryDomIndex(change.index);
                    this.removeEntriesFromDom(change.index, 1);
                    this.entries.splice(change.index, 0, newEntry);
                    this.children.splice(change.index, 0, newEntry.rendered);
                    this.attachRendered(newEntry.rendered, targetIndex);
                }
                optimized = true;
                break;
            }
            case 'swap': {
                const entryA = this.entries[change.index];
                const entryB = this.entries[change.index2];
                this.swapRendered(entryA.rendered, entryB.rendered, change.index, change.index2);
                this.entries[change.index] = entryB;
                this.entries[change.index2] = entryA;
                this.children[change.index] = entryB.rendered;
                this.children[change.index2] = entryA.rendered;
                optimized = true;
                break;
            }
            case 'prepend':
                this.insertEntries(0, change.items, change.itemIdentities, attachCalls);
                optimized = true;
                break;
            case 'insert':
                this.insertEntries(change.index, change.items, change.itemIdentities, attachCalls);
                optimized = true;
                break;
            case 'clear':
                this.removeEntriesFromDom(0, this.entries.length);
                optimized = true;
                break;
            default:
                throw new Error(`DOM updates from ${change.operationDetailed} are not supported`);
        }

        if (!optimized) {
            this.synchronizeChildren();
            this.updateDom();
        }
        for (const call of attachCalls) {
            call();
        }
    }

    private renderEntry(
        sourceValue: unknown,
        identity: CollectionItemIdentity,
        attachCalls: Array<() => void>
    ): ArrayRenderEntry {
        const sourceType = typeof sourceValue;
        if (sourceType === 'string' || sourceType === 'number' || sourceType === 'bigint' || sourceType === 'boolean') {
            return {
                identity,
                sourceValue,
                rendered: document.createTextNode(String(sourceValue))
            };
        }
        if (sourceValue instanceof HTMLElement || sourceValue instanceof Text || sourceValue instanceof SVGElement) {
            return { identity, sourceValue, rendered: sourceValue };
        }

        const session = createRenderSession(this.renderScope);
        let rendered = renderInternal(sourceValue as DOMRenderInput, session);

        if (Array.isArray(rendered)) {
            if (rendered.length === 1) {
                rendered = rendered[0];
            } else {
                rendered = new StaticAurumElement(rendered as Rendered[], createDOMAPI(session));
            }
        } else if (rendered === undefined || rendered === null) {
            rendered = new StaticAurumElement([], createDOMAPI(session));
        }

        if (rendered instanceof AurumElement) {
            session.sessionToken.addCancellable(() => rendered.dispose());
        }
        attachCalls.push(...session.attachCalls);
        return { identity, sourceValue, rendered: rendered as Rendered, session };
    }

    private attachRendered(rendered: Rendered, targetIndex: number): number {
        if (rendered instanceof AurumElement) {
            rendered.attachToDom(this.hostNode, targetIndex);
            this.lastEndIndex = this.getLastIndex();
            return this.lastEndIndex;
        }
        if (rendered instanceof HTMLElement || rendered instanceof Text || rendered instanceof SVGElement) {
            this.hostNode.insertBefore(rendered, this.hostNode.childNodes[targetIndex]);
            this.lastEndIndex++;
            return targetIndex + 1;
        }
        throw invalidRenderableError(rendered as never);
    }

    private swapDomNodes(nodeA: Node, nodeB: Node): void {
        if (nodeA.nextSibling === nodeB) {
            nodeB.parentNode.insertBefore(nodeB, nodeA);
            return;
        }
        if (nodeB.nextSibling === nodeA) {
            nodeA.parentNode.insertBefore(nodeA, nodeB);
            return;
        }

        const parentA = nodeA.parentNode;
        const siblingA = nodeA.nextSibling;
        nodeB.parentNode.insertBefore(nodeA, nodeB);
        parentA.insertBefore(nodeB, siblingA);
    }

    private firstDomNode(rendered: Rendered): Node {
        return rendered instanceof AurumElement ? aurumElementDomBounds.get(rendered)![0] : rendered;
    }

    private lastDomNode(rendered: Rendered): Node {
        return rendered instanceof AurumElement ? aurumElementDomBounds.get(rendered)![1] : rendered;
    }

    private moveRenderedBefore(rendered: Rendered, referenceNode: Node): void {
        if (!(rendered instanceof AurumElement)) {
            this.hostNode.insertBefore(rendered, referenceNode);
            return;
        }

        const [first, last] = aurumElementDomBounds.get(rendered)!;
        if (last.nextSibling === referenceNode) return;
        const afterLast = last.nextSibling;
        let node: Node = first;
        while (node !== afterLast) {
            const next = node.nextSibling;
            this.hostNode.insertBefore(node, referenceNode);
            node = next;
        }
    }

    private swapRendered(first: Rendered, second: Rendered, firstIndex: number, secondIndex: number): void {
        if (!(first instanceof AurumElement) && !(second instanceof AurumElement)) {
            this.swapDomNodes(first, second);
            return;
        }

        const low = firstIndex < secondIndex ? first : second;
        const high = firstIndex < secondIndex ? second : first;
        const adjacent = this.lastDomNode(low).nextSibling === this.firstDomNode(high);
        const afterHigh = this.lastDomNode(high).nextSibling;
        this.moveRenderedBefore(high, this.firstDomNode(low));
        if (!adjacent) this.moveRenderedBefore(low, afterHigh);
    }
}

export class SingularAurumElement extends AurumElement {
    private static readonly immediateContentCommit = SingularAurumElement.prototype.handleNewContent;
    private renderSession: RenderSession;
    private lastValue: DOMRenderInput;
    private dataSource: DataSource<DOMRenderInput>;
    private readonly batchedContentCommit = (newValue: DOMRenderInput): void => {
        if (!this.disposed) SingularAurumElement.immediateContentCommit.call(this, newValue);
    };

    constructor(dataSource: DataSource<DOMRenderInput>, api: AurumComponentAPI<DOMPrerendered>) {
        super(dataSource, api);
        this.api.cancellationToken.addCancellable(() => this.renderSession?.sessionToken.cancel());
        this.dataSource = dataSource;
        registerAurumRenderBinding(dataSource, this, 'DOM reactive content', api.cancellationToken, api.renderSession);
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }
        this.api.cancellationToken.cancel();
        if (this.disposed) return;
        super.dispose();
    }

    public attachToDom(node: HTMLElement, index: number): void {
        super.attachToDom(node, index);
        //@ts-ignore
        this.contentStartMarker.dataSource = this.dataSource;
        //@ts-ignore
        this.contentEndMarker.dataSource = this.dataSource;
    }

    protected render(dataSource: DataSource<DOMRenderInput>): void {
        dataSource.listenAndRepeat((n) => {
            if (!this.disposed) {
                this.handleNewContent(n);
            }
        }, this.api.cancellationToken);
    }

    private queueBatchedContent(newValue: DOMRenderInput): void {
        queueRenderUpdate(this, this.batchedContentCommit, newValue);
    }

    public static setRenderBatching(active: boolean): void {
        SingularAurumElement.prototype.handleNewContent = active
            ? SingularAurumElement.prototype.queueBatchedContent
            : SingularAurumElement.immediateContentCommit;
    }

    private handleNewContent(newValue: DOMRenderInput): void {
        if (this.lastValue === newValue) {
            return;
        }
        let optimized = false;
        if (this.children.length === 1 && this.children[0] instanceof Text) {
            const type = typeof newValue;
            if (type === 'string' || type === 'bigint' || type === 'number' || type === 'boolean') {
                this.children[0].nodeValue = String(newValue);
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

    private fullRebuild(newValue: DOMRenderInput): void {
        this.clearContent();
        this.endSession();
        this.renderSession = createRenderSession(this.renderScope);
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

/**
 * A lightweight range used only when an array entry has zero or multiple roots.
 */
class StaticAurumElement extends AurumElement {
    constructor(children: Rendered[], api: AurumComponentAPI<DOMPrerendered>) {
        super(undefined, api);
        this.children = children;
    }

    public attachToDom(node: HTMLElement, index: number): void {
        super.attachToDom(node, index);
        this.updateDom();
    }

    protected render(): void {}
}

listenToRenderBatchState((active) => {
    ArrayAurumElement.setRenderBatching(active);
    SingularAurumElement.setRenderBatching(active);
});
