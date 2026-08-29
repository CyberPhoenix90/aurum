import { AURUM_DEVTOOLS_DEBUG_BUILD_ENABLED, ArrayDataSource, CollectionChange, CollectionItemIdentity, DataSource } from '@aurumjs/streams';
import {
    AurumComponentAPI,
    AurumElementModel,
    aurumElementModelIdentitiy,
    createAPI as createCoreAPI,
    createRenderSession,
    isAurumDevtoolsDebugBuild,
    linkAurumDomNodeChildren,
    registerAurumRenderBinding,
    Renderable,
    RenderSession,
    traceAurumComponentRender
} from '@aurumjs/rendering';
import { listenToRenderBatchState, queueRenderUpdate } from './render_batch.js';

export type Rendered = AurumElement | HTMLElement | Text | SVGElement;
type DOMRenderInput = Renderable | Rendered | DOMRenderInput[];
export abstract class AurumElement {
    public children: Rendered[];
    protected api: AurumComponentAPI<DOMPrerendered>;
    protected renderScope: RenderSession;
    private static id: number = 1;

    // End-of-range comment anchor. Content always lives directly before it. A text-only
    // SingularAurumElement aliases it to its Text node and an empty StaticAurumElement to
    // its placeholder; the range start is resolved through `children` instead of a marker.
    protected contentEndMarker: CharacterData;
    protected hostNode: HTMLElement;
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
            this.contentEndMarker.remove();
        }
        this.disposed = true;
    }

    public attachToDom(node: HTMLElement, index: number): void {
        this.attachToDomBefore(node, node.childNodes[index] ?? null);
    }

    public attachToDomBefore(node: HTMLElement, referenceNode: Node | null): void {
        if (this.hostNode) {
            throw new Error('Aurum Element is already attached');
        }

        this.hostNode = node;
        this.createContentMarkers();
        node.insertBefore(this.contentEndMarker, referenceNode);
    }

    protected createContentMarkers(): void {
        this.contentEndMarker = document.createComment('Aurum Node ' + AurumElement.id++);
        //@ts-ignore
        this.contentEndMarker.owner = this;
    }

    /** First DOM node currently belonging to this element; its end anchor when it renders nothing. */
    public firstNode(): Node {
        for (const child of this.children) {
            if (child === undefined || child === null) {
                continue;
            }
            return child instanceof AurumElement ? child.firstNode() : child;
        }
        return this.contentEndMarker;
    }

    /** Last DOM node belonging to this element; the stable end anchor for comment-bounded ranges. */
    public lastNode(): Node {
        return this.contentEndMarker;
    }

    protected abstract render(dataSource: DataSource<DOMRenderInput> | ArrayDataSource<DOMRenderInput>): void;

    /**
     * Removes this element's current content. Ownership is tracked in `children`, so only
     * nodes this element rendered are touched; foreign nodes imperatively inserted into the
     * range are left alone.
     */
    protected clearContent(): void {
        if (this.hostNode === undefined) {
            throw new Error('illegal state: Aurum element was not attched to anything');
        }

        for (const child of this.children) {
            if (child === undefined || child === null) {
                continue;
            }
            if (child instanceof AurumElement) {
                child.dispose();
            } else {
                child.remove();
            }
        }
    }

    /**
     * Inserts all children before the end marker. The content region is always empty when
     * this runs (fresh attach or right after clearContent), so this is append-only: runs of
     * plain nodes are committed as single fragments.
     */
    protected updateDom(): void {
        const anchor = this.contentEndMarker;
        let fragment: DocumentFragment | undefined;
        for (const child of this.children) {
            if (child === undefined || child === null) {
                continue;
            }
            if (child instanceof AurumElement) {
                if (fragment !== undefined) {
                    this.hostNode.insertBefore(fragment, anchor);
                    fragment = undefined;
                }
                child.attachToDomBefore(this.hostNode, anchor);
            } else if (child instanceof HTMLElement || child instanceof Text || child instanceof SVGElement) {
                (fragment ??= document.createDocumentFragment()).appendChild(child);
            } else {
                throw invalidRenderableError(child as never);
            }
        }
        if (fragment !== undefined) {
            this.hostNode.insertBefore(fragment, anchor);
        }
        this.linkHostChildren();
    }

    protected linkHostChildren(): void {
        if (!AURUM_DEVTOOLS_DEBUG_BUILD_ENABLED) return;
        linkAurumDomNodeChildren(
            this.hostNode,
            this.children.filter((child): child is HTMLElement | SVGElement => child instanceof HTMLElement || child instanceof SVGElement),
            this.renderScope.sessionToken
        );
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
    if (element == undefined || typeof element === 'boolean') {
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
        } else if (type === 'number' || type === 'bigint') {
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
            const api = model.props ? (createDOMAPI(session) as AurumComponentAPI) : ({ renderSession: session } as AurumComponentAPI);
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

/**
 * Marks the members of one longest strictly increasing subsequence.
 * Entries flagged true can keep their DOM position during a reorder.
 */
function markLongestIncreasingSubsequence(sequence: readonly number[]): boolean[] {
    const stable: boolean[] = new Array(sequence.length).fill(false);
    if (sequence.length === 0) return stable;

    const predecessors: number[] = new Array(sequence.length);
    // Indices into sequence of the smallest known tail for each subsequence length.
    const tails: number[] = [];
    for (let index = 0; index < sequence.length; index++) {
        const value = sequence[index];
        let low = 0;
        let high = tails.length;
        while (low < high) {
            const mid = (low + high) >> 1;
            if (sequence[tails[mid]] < value) low = mid + 1;
            else high = mid;
        }
        predecessors[index] = low > 0 ? tails[low - 1] : -1;
        tails[low] = index;
    }

    let cursor = tails[tails.length - 1];
    while (cursor !== -1) {
        stable[cursor] = true;
        cursor = predecessors[cursor];
    }
    return stable;
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

    public attachToDomBefore(node: HTMLElement, referenceNode: Node | null): void {
        super.attachToDomBefore(node, referenceNode);
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
        ArrayAurumElement.prototype.handleNewContent = active ? ArrayAurumElement.prototype.queueBatchedContent : ArrayAurumElement.immediateContentCommit;
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
    }

    /** DOM node before which content inserted at this entry position must land. */
    private entryAnchorNode(index: number): Node {
        if (index >= this.entries.length) return this.contentEndMarker;
        return this.firstDomNode(this.entries[index].rendered);
    }

    private insertEntryGapBefore(entries: readonly ArrayRenderEntry[], anchorIndex: number): void {
        if (entries.length === 0) return;

        const referenceNode = this.entryAnchorNode(anchorIndex);
        if (entries.every((entry) => !(entry.rendered instanceof AurumElement))) {
            const fragment = document.createDocumentFragment();
            for (const entry of entries) fragment.appendChild(entry.rendered as Node);
            this.hostNode.insertBefore(fragment, referenceNode);
            return;
        }

        for (const entry of entries) {
            this.attachRenderedBefore(entry.rendered, referenceNode);
        }
    }

    private insertEntries(
        index: number,
        values: readonly DOMRenderInput[],
        identities: readonly CollectionItemIdentity[] | undefined,
        attachCalls: Array<() => void>
    ): void {
        // Node anchors stay valid no matter how earlier siblings change, so resolve once up front.
        const referenceNode = this.entryAnchorNode(index);
        const newEntries = values.map((value, itemIndex) => this.renderEntry(value, identities?.[itemIndex], attachCalls));
        this.entries.splice(index, 0, ...newEntries);
        this.children.splice(index, 0, ...newEntries.map((entry) => entry.rendered));

        if (newEntries.length > 0 && newEntries.every((entry) => !(entry.rendered instanceof AurumElement))) {
            const fragment = document.createDocumentFragment();
            for (const entry of newEntries) fragment.appendChild(entry.rendered as Node);
            this.hostNode.insertBefore(fragment, referenceNode);
            return;
        }

        for (const entry of newEntries) {
            this.attachRenderedBefore(entry.rendered, referenceNode);
        }
    }

    private tryApplySubsequenceRemoval(desiredIdentities: readonly CollectionItemIdentity[]): boolean {
        if (desiredIdentities.length >= this.entries.length) return false;

        const removals: Array<{ index: number; count: number }> = [];
        const retainedEntries: ArrayRenderEntry[] = [];
        let desiredIndex = 0;
        let removalStart = -1;

        for (let entryIndex = 0; entryIndex < this.entries.length; entryIndex++) {
            if (desiredIndex < desiredIdentities.length && this.entries[entryIndex].identity === desiredIdentities[desiredIndex]) {
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
            if (entryIndex < this.entries.length && desiredIdentities[desiredIndex] === this.entries[entryIndex].identity) {
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

    /**
     * Keyed reconciliation for arbitrary merges: retained entries forming a longest
     * increasing subsequence of the previous order stay put, everything else is
     * moved or inserted right-to-left against a stable anchor. DOM operations are
     * proportional to the entries that actually changed position.
     */
    private applyMergeReconciliation(
        desiredIdentities: readonly CollectionItemIdentity[],
        desiredValues: readonly DOMRenderInput[],
        attachCalls: Array<() => void>
    ): void {
        const entriesByIdentity = new Map(this.entries.map((entry) => [entry.identity, entry]));
        const retainedEntries = new Set<ArrayRenderEntry>();
        const desiredEntries: ArrayRenderEntry[] = new Array(desiredValues.length);
        const isNewEntry: boolean[] = new Array(desiredValues.length);
        for (let index = 0; index < desiredValues.length; index++) {
            const retained = entriesByIdentity.get(desiredIdentities[index]);
            if (retained !== undefined) {
                desiredEntries[index] = retained;
                isNewEntry[index] = false;
                retainedEntries.add(retained);
            } else {
                desiredEntries[index] = this.renderEntry(desiredValues[index], desiredIdentities[index], attachCalls);
                isNewEntry[index] = true;
            }
        }

        const removedEntries: ArrayRenderEntry[] = [];
        const previousIndexByEntry = new Map<ArrayRenderEntry, number>();
        for (let index = 0; index < this.entries.length; index++) {
            const entry = this.entries[index];
            if (retainedEntries.has(entry)) {
                previousIndexByEntry.set(entry, index);
            } else {
                removedEntries.push(entry);
            }
        }
        if (removedEntries.length > 0) {
            this.detachEntriesFromDom(removedEntries);
        }

        if (retainedEntries.size === 0 && desiredEntries.every((entry) => !(entry.rendered instanceof AurumElement))) {
            const fragment = document.createDocumentFragment();
            for (const entry of desiredEntries) fragment.appendChild(entry.rendered as Node);
            this.hostNode.insertBefore(fragment, this.contentEndMarker);
        } else {
            const retainedDesiredIndices: number[] = [];
            const previousOrder: number[] = [];
            for (let index = 0; index < desiredEntries.length; index++) {
                if (!isNewEntry[index]) {
                    retainedDesiredIndices.push(index);
                    previousOrder.push(previousIndexByEntry.get(desiredEntries[index]));
                }
            }
            const stableFlags = markLongestIncreasingSubsequence(previousOrder);
            const stableByDesiredIndex: boolean[] = new Array(desiredEntries.length).fill(false);
            for (let sequenceIndex = 0; sequenceIndex < retainedDesiredIndices.length; sequenceIndex++) {
                if (stableFlags[sequenceIndex]) stableByDesiredIndex[retainedDesiredIndices[sequenceIndex]] = true;
            }

            let anchor: Node = this.contentEndMarker;
            for (let index = desiredEntries.length - 1; index >= 0; index--) {
                const rendered = desiredEntries[index].rendered;
                if (stableByDesiredIndex[index]) {
                    anchor = this.firstDomNode(rendered);
                    continue;
                }
                if (isNewEntry[index]) {
                    if (rendered instanceof AurumElement) {
                        rendered.attachToDomBefore(this.hostNode, anchor);
                    } else {
                        this.hostNode.insertBefore(rendered, anchor);
                    }
                } else {
                    this.moveRenderedBefore(rendered, anchor);
                }
                anchor = this.firstDomNode(rendered);
            }
        }

        this.entries = desiredEntries;
        this.synchronizeChildren();
        this.linkHostChildren();
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
                while (retainedPrefixLength < sharedPrefixLength && this.entries[retainedPrefixLength].identity === desiredIdentities[retainedPrefixLength]) {
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

                this.applyMergeReconciliation(desiredIdentities, change.newState, attachCalls);
                optimized = true;
                break;
            }
            case 'remove':
            case 'removeLeft':
            case 'removeRight':
                this.removeEntriesFromDom(change.index, change.items.length);
                optimized = true;
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
                    const referenceNode = this.entryAnchorNode(change.index + 1);
                    this.removeEntriesFromDom(change.index, 1);
                    this.entries.splice(change.index, 0, newEntry);
                    this.children.splice(change.index, 0, newEntry.rendered);
                    this.attachRenderedBefore(newEntry.rendered, referenceNode);
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

    private renderEntry(sourceValue: unknown, identity: CollectionItemIdentity, attachCalls: Array<() => void>): ArrayRenderEntry {
        const sourceType = typeof sourceValue;
        if (sourceType === 'string' || sourceType === 'number' || sourceType === 'bigint') {
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

    private attachRenderedBefore(rendered: Rendered, referenceNode: Node): void {
        if (rendered instanceof AurumElement) {
            rendered.attachToDomBefore(this.hostNode, referenceNode);
            return;
        }
        if (rendered instanceof HTMLElement || rendered instanceof Text || rendered instanceof SVGElement) {
            this.hostNode.insertBefore(rendered, referenceNode);
            return;
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
        return rendered instanceof AurumElement ? rendered.firstNode() : rendered;
    }

    private lastDomNode(rendered: Rendered): Node {
        return rendered instanceof AurumElement ? rendered.lastNode() : rendered;
    }

    private moveRenderedBefore(rendered: Rendered, referenceNode: Node): void {
        if (!(rendered instanceof AurumElement)) {
            if (rendered.nextSibling !== referenceNode) {
                this.hostNode.insertBefore(rendered, referenceNode);
            }
            return;
        }

        const first = rendered.firstNode();
        const last = rendered.lastNode();
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

/** Values a reactive binding can show as a bare Text node: primitives render their text, everything else renders empty. */
function isTextOnlyValue(value: unknown): boolean {
    const type = typeof value;
    return type === 'string' || type === 'number' || type === 'bigint' || type === 'boolean' || value === null || value === undefined;
}

function textOnlyValueToString(value: unknown): string {
    const type = typeof value;
    if (type === 'string') return value as string;
    if (type === 'number' || type === 'bigint') return String(value);
    return '';
}

export class SingularAurumElement extends AurumElement {
    private static readonly immediateContentCommit = SingularAurumElement.prototype.handleNewContent;
    private renderSession: RenderSession;
    private lastValue: DOMRenderInput;
    private dataSource: DataSource<DOMRenderInput>;
    /**
     * While the source only ever produced text-like values, the binding is a single Text node
     * with no comment markers. It is promoted to a comment-bounded range the first time a
     * non-primitive renderable appears, and stays a range from then on.
     */
    private textNode: Text | undefined;
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
        if (this.textNode !== undefined) {
            if (this.hostNode?.isConnected) {
                this.textNode.remove();
            }
            this.disposed = true;
            return;
        }
        super.dispose();
    }

    public attachToDomBefore(node: HTMLElement, referenceNode: Node | null): void {
        const value = this.dataSource.value;
        if (isTextOnlyValue(value)) {
            this.attachAsText(node, referenceNode, value);
            return;
        }
        super.attachToDomBefore(node, referenceNode);
        this.tagMarkers();
    }

    private attachAsText(node: HTMLElement, referenceNode: Node | null, value: DOMRenderInput): void {
        if (this.hostNode) {
            throw new Error('Aurum Element is already attached');
        }
        const text = document.createTextNode(textOnlyValueToString(value));
        //@ts-ignore
        text.owner = this;
        //@ts-ignore
        text.dataSource = this.dataSource;
        this.hostNode = node;
        this.textNode = text;
        // The text node stands in for the end anchor so firstNode/lastNode resolve to it.
        this.contentEndMarker = text;
        node.insertBefore(text, referenceNode);
        this.children = [text];
        this.lastValue = value;
    }

    /**
     * Promotion is deliberately one-way: a source that oscillates between text and elements
     * would otherwise churn markers on every flip, and the range-mode text fast path already
     * makes post-promotion text updates cheap.
     */
    private promoteToRange(): void {
        const text = this.textNode;
        this.textNode = undefined;
        this.createContentMarkers();
        this.tagMarkers();
        this.hostNode.insertBefore(this.contentEndMarker, text);
        text.remove();
        this.children = [];
    }

    private tagMarkers(): void {
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
        if (this.textNode !== undefined) {
            if (isTextOnlyValue(newValue)) {
                this.textNode.nodeValue = textOnlyValueToString(newValue);
                this.lastValue = newValue;
                return;
            }
            this.promoteToRange();
        }
        let optimized = false;
        if (this.children.length === 1 && this.children[0] instanceof Text) {
            const type = typeof newValue;
            if (type === 'string' || type === 'bigint' || type === 'number') {
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
 * A lightweight multi-root range used only when an array entry has zero or multiple roots.
 * It owns no comment markers: its bounds resolve through its immutable children, and an
 * empty entry keeps its position in the collection with a single empty text node.
 */
class StaticAurumElement extends AurumElement {
    constructor(children: Rendered[], api: AurumComponentAPI<DOMPrerendered>) {
        super(undefined, api);
        this.children = children;
    }

    public lastNode(): Node {
        for (let index = this.children.length - 1; index >= 0; index--) {
            const child = this.children[index];
            if (child === undefined || child === null) {
                continue;
            }
            return child instanceof AurumElement ? child.lastNode() : child;
        }
        return this.contentEndMarker;
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }
        if (this.hostNode?.isConnected) {
            this.clearContent();
            this.contentEndMarker?.remove();
        }
        this.disposed = true;
    }

    public attachToDomBefore(node: HTMLElement, referenceNode: Node | null): void {
        if (this.hostNode) {
            throw new Error('Aurum Element is already attached');
        }
        this.hostNode = node;
        if (this.children.length === 0) {
            const placeholder = document.createTextNode('');
            //@ts-ignore
            placeholder.owner = this;
            this.contentEndMarker = placeholder;
            node.insertBefore(placeholder, referenceNode);
            return;
        }

        let fragment: DocumentFragment | undefined;
        for (const child of this.children) {
            if (child === undefined || child === null) {
                continue;
            }
            if (child instanceof AurumElement) {
                if (fragment !== undefined) {
                    node.insertBefore(fragment, referenceNode);
                    fragment = undefined;
                }
                child.attachToDomBefore(node, referenceNode);
            } else if (child instanceof HTMLElement || child instanceof Text || child instanceof SVGElement) {
                (fragment ??= document.createDocumentFragment()).appendChild(child);
            } else {
                throw invalidRenderableError(child as never);
            }
        }
        if (fragment !== undefined) {
            node.insertBefore(fragment, referenceNode);
        }
        this.linkHostChildren();
    }

    protected render(): void {}
}

listenToRenderBatchState((active) => {
    ArrayAurumElement.setRenderBatching(active);
    SingularAurumElement.setRenderBatching(active);
});
