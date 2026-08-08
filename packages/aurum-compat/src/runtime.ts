import {
    Aurum as NativeAurum,
    DomNodeCreator,
    Portal as NativePortal,
    type AurumComponentAPI,
    type PortalTarget,
    type Renderable as NativeRenderable
} from '@aurum/html';
import { ArrayDataSource, DataSource, type CancellationToken } from '@aurum/streams';
import type {
    CompatElement,
    ComponentType,
    DependencyList,
    Dispatch,
    EffectCallback,
    ForwardedRef,
    Key,
    ReactNode,
    Ref,
    RefObject,
    SetStateAction
} from './types.js';
import {
    CONTEXT_PROVIDER,
    FORWARD_REF,
    Fragment,
    MEMO,
    PORTAL,
    type ForwardRefMetadata,
    type InternalCompatElement,
    type MarkedComponent,
    type MemoMetadata,
    isCompatElement,
    jsx
} from './vnode.js';

type Namespace = 'html' | 'svg';
type ContextValues = ReadonlyMap<Context<any>, unknown>;
type RefCleanup = void | (() => void);

const TEXT_KIND = Symbol('compat.text');
const HOST_KIND = Symbol('compat.host');
const FRAGMENT_KIND = Symbol('compat.fragment');
const PROVIDER_KIND = Symbol('compat.provider');
const PORTAL_KIND = Symbol('compat.portal');

interface ReconcileEnvironment {
    readonly contexts: ContextValues;
    readonly namespace: Namespace;
}

interface MountedNode {
    readonly key: Key | null;
    readonly renderable: NativeRenderable;
    canUpdate(value: ReactNode, environment: ReconcileEnvironment): boolean;
    update(value: ReactNode, environment: ReconcileEnvironment): void;
    dispose(): void;
}

interface EventBinding {
    eventName: string;
    capture: boolean;
    listener: EventListener;
    handler: (event: Event) => unknown;
}

interface StateHook<S = unknown> {
    kind: 'state';
    value: S;
    dispatch: Dispatch<SetStateAction<S>>;
}

interface MemoHook<T = unknown> {
    readonly kind: 'memo';
    value: T;
    dependencies: DependencyList | undefined;
}

interface RefHook<T = unknown> {
    readonly kind: 'ref';
    readonly value: RefObject<T>;
}

interface EffectHook {
    readonly kind: 'effect';
    readonly layout: boolean;
    dependencies: DependencyList | undefined;
    cleanup?: () => void;
    effect?: EffectCallback;
    pending: boolean;
}

interface DeferredHook<T = unknown> {
    readonly kind: 'deferred';
    value: T;
    requested: T;
    scheduled: boolean;
}

interface IdHook {
    readonly kind: 'id';
    readonly value: string;
}

interface ExternalStoreHook<T = unknown> {
    readonly kind: 'external-store';
    value: T;
    subscribe: (onStoreChange: () => void) => void | (() => void);
    getSnapshot: () => T;
    unsubscribe?: () => void;
    needsSubscription: boolean;
    subscribed: boolean;
}

type Hook = StateHook | MemoHook | RefHook | EffectHook | DeferredHook | IdHook | ExternalStoreHook;

let currentComponent: ComponentInstance | undefined;
let currentHookIndex = 0;
let nextComponentId = 1;
let workDepth = 0;
let batchDepth = 0;
let passiveScheduled = false;

const pendingRenders = new Set<ComponentInstance>();
const pendingLayoutEffects = new Set<ComponentInstance>();
const pendingPassiveEffects = new Set<ComponentInstance>();
const pendingControlledHosts = new Set<HostInstance>();

const EMPTY_CONTEXT: ContextValues = new Map();

function beginWork(): void {
    workDepth++;
}

function endWork(): void {
    workDepth--;
    if (workDepth !== 0 || batchDepth !== 0) return;
    flushPendingRenders();
    flushControlledHosts();
    flushLayoutEffects();
    schedulePassiveFlush();
}

function flushControlledHosts(): void {
    if (pendingControlledHosts.size === 0) return;
    const hosts = Array.from(pendingControlledHosts);
    pendingControlledHosts.clear();
    for (const host of hosts) host.finalizeControlledProps();
}

function performWork<T>(callback: () => T): T {
    beginWork();
    try {
        return callback();
    } finally {
        endWork();
    }
}

function batchedUpdates<T>(callback: () => T): T {
    batchDepth++;
    try {
        return callback();
    } finally {
        batchDepth--;
        if (batchDepth === 0 && workDepth === 0) {
            performWork(() => flushPendingRenders());
        }
    }
}

function flushPendingRenders(): void {
    let guard = 0;
    while (pendingRenders.size > 0) {
        if (++guard > 1000) throw new Error('Aurum compat exceeded the update limit');
        const components = Array.from(pendingRenders);
        pendingRenders.clear();
        for (const component of components) component.flushRequestedRender();
    }
}

function flushLayoutEffects(): void {
    let guard = 0;
    while (pendingLayoutEffects.size > 0) {
        if (++guard > 1000) throw new Error('Aurum compat exceeded the layout effect update limit');
        const components = Array.from(pendingLayoutEffects);
        pendingLayoutEffects.clear();
        for (const component of components) component.flushLayoutEffects();
        flushPendingRenders();
    }
}

function schedulePassiveFlush(): void {
    if (passiveScheduled || pendingPassiveEffects.size === 0) return;
    passiveScheduled = true;
    queueMicrotask(() => {
        passiveScheduled = false;
        performWork(() => flushPassiveEffects());
    });
}

function flushPassiveEffects(): void {
    let guard = 0;
    while (pendingPassiveEffects.size > 0) {
        if (++guard > 1000) throw new Error('Aurum compat exceeded the passive effect update limit');
        const components = Array.from(pendingPassiveEffects);
        pendingPassiveEffects.clear();
        for (const component of components) component.flushPassiveEffects();
        flushPendingRenders();
        flushLayoutEffects();
    }
}

function dependenciesEqual(previous: DependencyList | undefined, next: DependencyList | undefined): boolean {
    if (previous === undefined || next === undefined || previous.length !== next.length) return false;
    for (let index = 0; index < previous.length; index++) {
        if (!Object.is(previous[index], next[index])) return false;
    }
    return true;
}

function assertRendering(hook: string): ComponentInstance {
    if (!currentComponent) throw new Error(`${hook} can only be called while rendering a compat function component`);
    return currentComponent;
}

function readHook<T extends Hook>(kind: T['kind'], create: () => T): T {
    const component = assertRendering(`use${kind}`);
    const index = currentHookIndex++;
    const existing = component.hooks[index];
    if (existing) {
        if (existing.kind !== kind) throw new Error(`Hook order changed in ${component.displayName}`);
        return existing as T;
    }
    const hook = create();
    component.hooks[index] = hook;
    return hook;
}

export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
export function useState<S>(initialState?: S | (() => S)): [S | undefined, Dispatch<SetStateAction<S | undefined>>] {
    const component = assertRendering('useState');
    const hook = readHook<StateHook<S | undefined>>('state', () => {
        const created = {} as StateHook<S | undefined>;
        created.kind = 'state';
        created.value = typeof initialState === 'function' ? (initialState as () => S)() : initialState;
        created.dispatch = (action: SetStateAction<S | undefined>): void => {
            if (component.isDisposed) return;
            const next = typeof action === 'function' ? (action as (value: S | undefined) => S | undefined)(created.value) : action;
            if (Object.is(created.value, next)) return;
            created.value = next;
            component.requestRender();
        };
        return created;
    });
    return [hook.value, hook.dispatch];
}

export function useMemo<T>(factory: () => T, dependencies: DependencyList): T {
    const hook = readHook<MemoHook<T>>('memo', () => ({ kind: 'memo', value: factory(), dependencies }));
    if (!dependenciesEqual(hook.dependencies, dependencies)) {
        hook.value = factory();
        hook.dependencies = dependencies;
    }
    return hook.value;
}

export function useCallback<T extends Function>(callback: T, dependencies: DependencyList): T {
    return useMemo(() => callback, dependencies);
}

export function useRef<T>(initialValue: T): RefObject<T>;
export function useRef<T>(initialValue: T | null): RefObject<T | null>;
export function useRef<T = undefined>(): RefObject<T | undefined>;
export function useRef<T>(initialValue?: T | null): RefObject<T | null | undefined> {
    return readHook<RefHook<T | null | undefined>>('ref', () => ({ kind: 'ref', value: { current: initialValue } })).value;
}

function useEffectImplementation(layout: boolean, effect: EffectCallback, dependencies?: DependencyList): void {
    const hook = readHook<EffectHook>('effect', () => ({
        kind: 'effect',
        layout,
        dependencies,
        effect,
        pending: true
    }));
    if (hook.layout !== layout) throw new Error('Hook order changed between useEffect and useLayoutEffect');
    if (!dependenciesEqual(hook.dependencies, dependencies)) {
        hook.dependencies = dependencies;
        hook.effect = effect;
        hook.pending = true;
    }
}

export function useEffect(effect: EffectCallback, dependencies?: DependencyList): void {
    useEffectImplementation(false, effect, dependencies);
}

export function useLayoutEffect(effect: EffectCallback, dependencies?: DependencyList): void {
    useEffectImplementation(true, effect, dependencies);
}

export function useDeferredValue<T>(value: T, initialValue?: T): T {
    const component = assertRendering('useDeferredValue');
    const hook = readHook<DeferredHook<T>>('deferred', () => ({
        kind: 'deferred',
        value: initialValue === undefined ? value : initialValue,
        requested: value,
        scheduled: false
    }));
    hook.requested = value;
    if (!Object.is(hook.value, value) && !hook.scheduled) {
        hook.scheduled = true;
        queueMicrotask(() => {
            hook.scheduled = false;
            if (component.isDisposed || Object.is(hook.value, hook.requested)) return;
            hook.value = hook.requested;
            component.requestRender();
        });
    }
    return hook.value;
}

export function useId(): string {
    const component = assertRendering('useId');
    const hookIndex = currentHookIndex;
    return readHook<IdHook>('id', () => ({ kind: 'id', value: `:aurum-r${component.id}-h${hookIndex}:` })).value;
}

export function useSyncExternalStore<T>(
    subscribe: (onStoreChange: () => void) => void | (() => void),
    getSnapshot: () => T,
    _getServerSnapshot?: () => T
): T {
    const component = assertRendering('useSyncExternalStore');
    const snapshot = getSnapshot();
    const hook = readHook<ExternalStoreHook<T>>('external-store', () => ({
        kind: 'external-store',
        value: snapshot,
        subscribe,
        getSnapshot,
        needsSubscription: true,
        subscribed: false
    }));
    if (hook.subscribe !== subscribe || hook.getSnapshot !== getSnapshot) {
        hook.subscribe = subscribe;
        hook.getSnapshot = getSnapshot;
        hook.needsSubscription = true;
    }
    hook.value = snapshot;
    component.hasExternalStoreWork = true;
    return hook.value;
}

export interface Context<T> {
    Provider: ComponentType<{ value: T; children?: ReactNode }>;
    Consumer: ComponentType<{ children: (value: T) => ReactNode }>;
    displayName?: string;
    readonly _defaultValue: T;
}

export function createContext<T>(defaultValue: T): Context<T> {
    const context = { _defaultValue: defaultValue } as Context<T>;
    const Provider = function CompatContextProvider(): ReactNode {
        throw new Error('A context Provider can only be rendered through JSX');
    } as ComponentType<{ value: T; children?: ReactNode }> & MarkedComponent;
    Object.defineProperty(Provider, CONTEXT_PROVIDER, { value: context });
    const Consumer = function CompatContextConsumer(props: { children: (value: T) => ReactNode }): ReactNode {
        return props.children(useContext(context));
    };
    context.Provider = Provider;
    context.Consumer = Consumer;
    return context;
}

export function useContext<T>(context: Context<T>): T {
    const component = assertRendering('useContext');
    const value = component.environment.contexts.has(context)
        ? (component.environment.contexts.get(context) as T)
        : context._defaultValue;
    component.nextContextDependencies.set(context, value);
    return value;
}

export function createRef<T>(): RefObject<T | null> {
    return { current: null };
}

export function useImperativeHandle<T, R extends T>(ref: ForwardedRef<T>, create: () => R, dependencies?: DependencyList): void {
    const effectDependencies = dependencies === undefined ? undefined : [...dependencies, ref];
    useLayoutEffect(() => {
        const cleanup = setRef(ref, create());
        return () => clearRef(ref, cleanup);
    }, effectDependencies);
}

export interface ForwardRefExoticComponent<P> extends ComponentType<P> {
    displayName?: string;
}

export function forwardRef<T, P = {}>(render: (props: P, ref: ForwardedRef<T>) => ReactNode): ForwardRefExoticComponent<P & { ref?: Ref<T> }> {
    const component = function CompatForwardRef(props: P & { ref?: Ref<T> }): ReactNode {
        return render(props, props.ref ?? null);
    } as ForwardRefExoticComponent<P & { ref?: Ref<T> }> & MarkedComponent;
    Object.defineProperty(component, FORWARD_REF, { value: { render } satisfies ForwardRefMetadata<T, P> });
    return component;
}

export interface MemoExoticComponent<P> extends ComponentType<P> {
    displayName?: string;
}

export function memo<P>(component: ComponentType<P>, compare?: (previous: Readonly<P>, next: Readonly<P>) => boolean): MemoExoticComponent<P> {
    const wrapped = function CompatMemo(props: P): ReactNode {
        return component(props);
    } as MemoExoticComponent<P> & MarkedComponent;
    Object.defineProperty(wrapped, MEMO, { value: { component, compare } satisfies MemoMetadata<P> });
    return wrapped;
}

export function createPortal(children: ReactNode, container: HTMLElement, key?: Key | null): CompatElement {
    return jsx(PORTAL, { children, container }, key ?? undefined);
}

function setRef<T>(ref: Ref<T> | undefined, value: T): RefCleanup {
    if (!ref) return undefined;
    if (typeof ref === 'function') return ref(value);
    ref.current = value;
    return undefined;
}

function clearRef<T>(ref: Ref<T> | undefined, cleanup?: RefCleanup): void {
    if (!ref) return;
    if (cleanup) cleanup();
    else if (typeof ref === 'function') ref(null);
    else ref.current = null;
}

function collectChildren(value: ReactNode, result: ReactNode[]): void {
    if (value == null || typeof value === 'boolean') return;
    if (Array.isArray(value)) {
        for (const child of value) collectChildren(child, result);
        return;
    }
    if (typeof value !== 'string' && typeof value === 'object' && !isCompatElement(value) && Symbol.iterator in value) {
        for (const child of value as Iterable<ReactNode>) collectChildren(child, result);
        return;
    }
    result.push(value);
}

function childKey(value: ReactNode): Key | null {
    return isCompatElement(value) ? value.key : null;
}

function reconcileChildren(
    previous: MountedNode[],
    value: ReactNode,
    environment: ReconcileEnvironment,
    source: ArrayDataSource<NativeRenderable>
): MountedNode[] {
    const inputs: ReactNode[] = [];
    collectChildren(value, inputs);

    const keyed = new Map<Key, MountedNode[]>();
    const unkeyed: MountedNode[] = [];
    for (const instance of previous) {
        if (instance.key === null) unkeyed.push(instance);
        else {
            const matches = keyed.get(instance.key);
            if (matches) matches.push(instance);
            else keyed.set(instance.key, [instance]);
        }
    }

    const retained = new Set<MountedNode>();
    const next: MountedNode[] = [];
    let unkeyedIndex = 0;
    for (const input of inputs) {
        const key = childKey(input);
        let candidate: MountedNode | undefined;
        if (key === null) candidate = unkeyed[unkeyedIndex++];
        else candidate = keyed.get(key)?.shift();

        if (candidate?.canUpdate(input, environment)) {
            retained.add(candidate);
            candidate.update(input, environment);
            next.push(candidate);
        } else {
            if (candidate) candidate.dispose();
            next.push(createMountedNode(input, environment));
        }
    }

    for (const instance of previous) {
        if (!retained.has(instance) && !next.includes(instance)) instance.dispose();
    }

    synchronizeRenderables(source, next.map((instance) => instance.renderable));
    return next;
}

/**
 * Keep the source-owned occurrence identity for every retained renderable.
 * Mounted renderables are unique objects, so explicit remove/swap/insert
 * operations give the native ArrayAurumElement an unambiguous keyed move.
 */
function synchronizeRenderables(source: ArrayDataSource<NativeRenderable>, desired: NativeRenderable[]): void {
    const retained = new Set(desired);
    for (let index = source.getData().length - 1; index >= 0; index--) {
        if (!retained.has(source.getData()[index])) source.removeAt(index);
    }

    for (let index = 0; index < desired.length; index++) {
        const current = source.getData();
        if (current[index] === desired[index]) continue;
        const existingIndex = current.indexOf(desired[index], index + 1);
        if (existingIndex === -1) source.insertAt(index, desired[index]);
        else source.swap(index, existingIndex);
    }

    if (source.getData().length > desired.length) source.removeRight(source.getData().length - desired.length);
}

function createMountedNode(value: ReactNode, environment: ReconcileEnvironment): MountedNode {
    const valueType = typeof value;
    if (valueType === 'string' || valueType === 'number' || valueType === 'bigint') return new TextInstance(value as string | number | bigint);
    if (!isCompatElement(value)) throw new TypeError(`Unsupported compat child: ${String(value)}`);
    if (value.type === Fragment) return new FragmentInstance(value, environment);
    if (value.type === PORTAL) return new PortalInstance(value, environment);
    if (typeof value.type === 'string') return new HostInstance(value, environment);
    if (typeof value.type === 'function') {
        const marked = value.type as MarkedComponent;
        if (marked[CONTEXT_PROVIDER]) return new ProviderInstance(value, environment, marked[CONTEXT_PROVIDER] as Context<unknown>);
        return new ComponentInstance(value, environment);
    }
    throw new TypeError('JSX element type must be an intrinsic tag or function component');
}

class TextInstance implements MountedNode {
    public readonly key: Key | null = null;
    public readonly renderable: NativeRenderable;
    private readonly source: DataSource<NativeRenderable>;

    public constructor(value: string | number | bigint) {
        this.source = new DataSource<NativeRenderable>(String(value), 'Compat text');
        this.renderable = this.source;
    }

    public canUpdate(value: ReactNode): boolean {
        const type = typeof value;
        return type === 'string' || type === 'number' || type === 'bigint';
    }

    public update(value: ReactNode): void {
        this.source.updateIfChanged(String(value));
    }

    public dispose(): void {}
}

class FragmentInstance implements MountedNode {
    public readonly key: Key | null;
    public readonly renderable: NativeRenderable;
    protected readonly source = new ArrayDataSource<NativeRenderable>([], 'Compat fragment children');
    protected children: MountedNode[] = [];
    protected disposed = false;

    public constructor(protected element: InternalCompatElement, protected environment: ReconcileEnvironment) {
        this.key = element.key;
        this.renderable = this.source;
        this.children = reconcileChildren(this.children, element.props.children, environment, this.source);
    }

    public canUpdate(value: ReactNode): boolean {
        return isCompatElement(value) && value.type === Fragment;
    }

    public update(value: ReactNode, environment: ReconcileEnvironment): void {
        if (!isCompatElement(value)) return;
        this.element = value;
        this.environment = environment;
        this.children = reconcileChildren(this.children, value.props.children, environment, this.source);
    }

    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        for (const child of this.children) child.dispose();
        this.children = [];
    }
}

class ProviderInstance implements MountedNode {
    public readonly key: Key | null;
    public readonly renderable: NativeRenderable;
    private readonly source = new ArrayDataSource<NativeRenderable>([], 'Compat context provider children');
    private children: MountedNode[] = [];
    private disposed = false;

    public constructor(
        private element: InternalCompatElement,
        private environment: ReconcileEnvironment,
        private readonly context: Context<unknown>
    ) {
        this.key = element.key;
        this.renderable = this.source;
        this.reconcile();
    }

    public canUpdate(value: ReactNode): boolean {
        return isCompatElement(value) && value.type === this.element.type;
    }

    public update(value: ReactNode, environment: ReconcileEnvironment): void {
        if (!isCompatElement(value)) return;
        this.element = value;
        this.environment = environment;
        this.reconcile();
    }

    private reconcile(): void {
        const contexts = new Map(this.environment.contexts);
        contexts.set(this.context, this.element.props.value);
        this.children = reconcileChildren(
            this.children,
            this.element.props.children,
            { ...this.environment, contexts },
            this.source
        );
    }

    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        for (const child of this.children) child.dispose();
        this.children = [];
    }
}

class PortalInstance implements MountedNode {
    public readonly key: Key | null;
    public readonly renderable: NativeRenderable;
    private readonly source = new ArrayDataSource<NativeRenderable>([], 'Compat portal children');
    private readonly target: DataSource<PortalTarget>;
    private children: MountedNode[] = [];
    private disposed = false;
    private element: InternalCompatElement;
    private environment: ReconcileEnvironment;

    public constructor(element: InternalCompatElement, environment: ReconcileEnvironment) {
        this.element = element;
        this.environment = environment;
        this.key = element.key;
        this.target = new DataSource<PortalTarget>(element.props.container, 'Compat portal target');
        this.children = reconcileChildren(this.children, element.props.children, environment, this.source);
        this.renderable = NativeAurum.factory(NativePortal, { target: this.target }, this.source) as NativeRenderable;
    }

    public canUpdate(value: ReactNode): boolean {
        return isCompatElement(value) && value.type === PORTAL;
    }

    public update(value: ReactNode, environment: ReconcileEnvironment): void {
        if (!isCompatElement(value)) return;
        const targetChanged = !Object.is(this.target.value, value.props.container);
        this.element = value;
        this.environment = environment;
        if (targetChanged) {
            for (const child of this.children) child.dispose();
            this.children = [];
            synchronizeRenderables(this.source, []);
            this.target.update(value.props.container);
        }
        this.children = reconcileChildren(this.children, value.props.children, environment, this.source);
    }

    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        for (const child of this.children) child.dispose();
        this.children = [];
    }
}

function CompatComponentBoundary(props: { instance: ComponentInstance }, _children: NativeRenderable[], api: AurumComponentAPI): NativeRenderable {
    props.instance.bindNativeLifecycle(api);
    return props.instance.outputSource;
}

class ComponentInstance implements MountedNode {
    public readonly key: Key | null;
    public readonly renderable: NativeRenderable;
    public readonly outputSource = new ArrayDataSource<NativeRenderable>([], 'Compat component output');
    public readonly hooks: Hook[] = [];
    public readonly id = nextComponentId++;
    public readonly displayName: string;
    public environment: ReconcileEnvironment;
    public nextContextDependencies = new Map<Context<any>, unknown>();
    public hasExternalStoreWork = false;

    private element: InternalCompatElement;
    private output: MountedNode[] = [];
    private attached = false;
    private disposed = false;
    private rendering = false;
    private rerenderRequested = false;
    private expectedHookCount: number | undefined;
    private contextDependencies = new Map<Context<any>, unknown>();
    private lastRendered: ReactNode = null;

    public constructor(element: InternalCompatElement, environment: ReconcileEnvironment) {
        this.element = element;
        this.environment = environment;
        this.key = element.key;
        this.displayName = (element.type as Function).name || 'Anonymous';
        this.renderable = NativeAurum.factory(CompatComponentBoundary, { instance: this }) as NativeRenderable;
        this.renderNow();
    }

    public get isDisposed(): boolean {
        return this.disposed;
    }

    public canUpdate(value: ReactNode): boolean {
        return isCompatElement(value) && value.type === this.element.type;
    }

    public update(value: ReactNode, environment: ReconcileEnvironment): void {
        if (!isCompatElement(value) || this.disposed) return;
        const previousElement = this.element;
        const contextChanged = this.didObservedContextChange(environment.contexts);
        this.element = value;
        this.environment = environment;
        const memoMetadata = (value.type as MarkedComponent)[MEMO] as MemoMetadata<any> | undefined;
        if (memoMetadata && !contextChanged) {
            const equal = memoMetadata.compare
                ? memoMetadata.compare(previousElement.props, value.props)
                : shallowEqual(previousElement.props, value.props);
            if (equal && previousElement.ref === value.ref) {
                // A memoized component may hide a context consumer deeper in
                // its retained output. Reconcile that output with the new
                // environment even when this component itself can be skipped.
                this.output = reconcileChildren(this.output, this.lastRendered, this.environment, this.outputSource);
                return;
            }
        }
        this.renderNow();
    }

    public requestRender(): void {
        if (this.disposed) return;
        if (this.rendering) {
            this.rerenderRequested = true;
            return;
        }
        if (batchDepth > 0 || workDepth > 0) {
            pendingRenders.add(this);
            return;
        }
        performWork(() => this.renderNow());
    }

    public flushRequestedRender(): void {
        if (!this.disposed) this.renderNow();
    }

    private renderNow(): void {
        if (this.disposed) return;
        pendingRenders.delete(this);
        let rendered: ReactNode = null;
        let renderCount = 0;
        do {
            if (++renderCount > 25) throw new Error(`Too many render-phase updates in ${this.displayName}`);
            this.rerenderRequested = false;
            this.rendering = true;
            currentComponent = this;
            currentHookIndex = 0;
            this.nextContextDependencies = new Map();
            this.hasExternalStoreWork = false;
            try {
                rendered = this.invokeComponent();
            } finally {
                this.rendering = false;
                currentComponent = undefined;
            }
            if (this.expectedHookCount !== undefined && currentHookIndex !== this.expectedHookCount) {
                throw new Error(`Hook count changed in ${this.displayName}`);
            }
            this.expectedHookCount = currentHookIndex;
        } while (this.rerenderRequested);

        this.contextDependencies = this.nextContextDependencies;
        this.lastRendered = rendered;
        this.output = reconcileChildren(this.output, rendered, this.environment, this.outputSource);
        this.queueEffects();
    }

    private invokeComponent(): ReactNode {
        const type = this.element.type as ComponentType<any> & MarkedComponent;
        const memoMetadata = type[MEMO] as MemoMetadata<any> | undefined;
        const effectiveType = memoMetadata?.component ?? type;
        const forwardMetadata = (effectiveType as MarkedComponent)[FORWARD_REF] as ForwardRefMetadata<any, any> | undefined;
        if (forwardMetadata) return forwardMetadata.render(this.element.props, this.element.ref);
        return effectiveType(this.element.props);
    }

    private didObservedContextChange(contexts: ContextValues): boolean {
        for (const [context, previous] of this.contextDependencies) {
            const next = contexts.has(context) ? contexts.get(context) : context._defaultValue;
            if (!Object.is(previous, next)) return true;
        }
        return false;
    }

    private queueEffects(): void {
        if (!this.attached) return;
        if (this.hooks.some((hook) => hook.kind === 'effect' && hook.layout && hook.pending) || this.hasExternalStoreWork) {
            pendingLayoutEffects.add(this);
        }
        if (this.hooks.some((hook) => hook.kind === 'effect' && !hook.layout && hook.pending)) {
            pendingPassiveEffects.add(this);
        }
    }

    public bindNativeLifecycle(api: AurumComponentAPI): void {
        api.onAttach(() => {
            if (this.disposed) return;
            this.attached = true;
            this.queueEffects();
            if (workDepth === 0 && batchDepth === 0) {
                performWork((): void => {});
            }
        });
        api.onDetach(() => this.dispose());
    }

    public flushLayoutEffects(): void {
        if (this.disposed || !this.attached) return;
        for (const hook of this.hooks) {
            if (hook.kind === 'effect' && hook.layout && hook.pending) runEffect(hook);
            else if (hook.kind === 'external-store') this.commitExternalStore(hook);
        }
    }

    public flushPassiveEffects(): void {
        if (this.disposed || !this.attached) return;
        for (const hook of this.hooks) {
            if (hook.kind === 'effect' && !hook.layout && hook.pending) runEffect(hook);
        }
    }

    private commitExternalStore<T>(hook: ExternalStoreHook<T>): void {
        if (!hook.needsSubscription && hook.subscribed) return;
        hook.unsubscribe?.();
        hook.unsubscribe = undefined;
        hook.needsSubscription = false;
        hook.subscribed = true;
        const notify = (): void => {
            if (this.disposed) return;
            const snapshot = hook.getSnapshot();
            if (Object.is(snapshot, hook.value)) return;
            hook.value = snapshot;
            this.requestRender();
        };
        const cleanup = hook.subscribe(notify);
        if (typeof cleanup === 'function') hook.unsubscribe = cleanup;
        notify();
    }

    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.attached = false;
        pendingRenders.delete(this);
        pendingLayoutEffects.delete(this);
        pendingPassiveEffects.delete(this);
        for (const hook of this.hooks) {
            if (hook.kind === 'effect') {
                hook.pending = false;
                hook.effect = undefined;
                hook.cleanup?.();
                hook.cleanup = undefined;
            } else if (hook.kind === 'external-store') {
                hook.unsubscribe?.();
                hook.unsubscribe = undefined;
                hook.subscribed = false;
            }
        }
        for (const child of this.output) child.dispose();
        this.output = [];
    }
}

function runEffect(hook: EffectHook): void {
    hook.pending = false;
    hook.cleanup?.();
    hook.cleanup = undefined;
    const cleanup = hook.effect?.();
    if (typeof cleanup === 'function') hook.cleanup = cleanup;
}

function shallowEqual(previous: Record<string, unknown>, next: Record<string, unknown>): boolean {
    if (Object.is(previous, next)) return true;
    const previousKeys = Object.keys(previous);
    const nextKeys = Object.keys(next);
    if (previousKeys.length !== nextKeys.length) return false;
    for (const key of previousKeys) {
        if (!Object.prototype.hasOwnProperty.call(next, key) || !Object.is(previous[key], next[key])) return false;
    }
    return true;
}

const svgTags = new Set([
    'svg', 'animate', 'animateMotion', 'animateTransform', 'circle', 'clipPath', 'defs', 'desc', 'ellipse', 'feBlend',
    'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
    'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage',
    'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
    'feTurbulence', 'filter', 'foreignObject', 'g', 'image', 'line', 'linearGradient', 'marker', 'mask', 'metadata', 'mpath',
    'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'set', 'stop', 'switch', 'symbol', 'text', 'textPath',
    'title', 'tspan', 'use', 'view'
]);
const svgFactories = new Map<string, ReturnType<typeof DomNodeCreator<any>>>();

function getSvgFactory(tag: string): ReturnType<typeof DomNodeCreator<any>> {
    let factory = svgFactories.get(tag);
    if (!factory) {
        factory = DomNodeCreator<any>(tag, [], undefined, undefined, true, true);
        svgFactories.set(tag, factory);
    }
    return factory;
}

function isRawHTML(element: InternalCompatElement): boolean {
    return element.props.dangerouslySetInnerHTML != null;
}

class HostInstance implements MountedNode {
    public readonly key: Key | null;
    public readonly renderable: NativeRenderable;
    private readonly source = new ArrayDataSource<NativeRenderable>([], 'Compat host children');
    private readonly classSource = new DataSource<string>('', 'Compat host className');
    private readonly styleSource = new DataSource<string>('', 'Compat host style');
    private readonly events = new Map<string, EventBinding>();
    private readonly namespace: Namespace;
    private readonly rawHTML: boolean;
    private element: InternalCompatElement;
    private environment: ReconcileEnvironment;
    private children: MountedNode[] = [];
    private node?: HTMLElement | SVGElement;
    private disposed = false;
    private refCleanup?: RefCleanup;

    public constructor(element: InternalCompatElement, environment: ReconcileEnvironment) {
        this.element = element;
        this.environment = environment;
        this.key = element.key;
        this.namespace = environment.namespace === 'svg' || element.type === 'svg' ? 'svg' : 'html';
        this.rawHTML = isRawHTML(element);
        this.classSource.update(normalizeClassName(element.props.className ?? element.props.class));
        this.styleSource.update(serializeStyle(element.props.style));

        if (!this.rawHTML) {
            this.children = reconcileChildren(this.children, element.props.children, this.childEnvironment(), this.source);
        }

        const nativeProps: Record<string, unknown> = {
            style: this.styleSource,
            onAttach: (node?: HTMLElement): void => this.attachNode(node as HTMLElement | SVGElement),
            onDetach: (): void => this.detachNode()
        };
        if (this.namespace === 'html') nativeProps.class = this.classSource;

        const nativeChildren = this.rawHTML ? [] : [this.source];
        if (this.namespace === 'svg') {
            this.renderable = NativeAurum.factory(getSvgFactory(element.type) as any, nativeProps, ...nativeChildren) as NativeRenderable;
        } else {
            this.renderable = NativeAurum.factory(element.type, nativeProps, ...nativeChildren) as NativeRenderable;
        }
    }

    public canUpdate(value: ReactNode, environment: ReconcileEnvironment): boolean {
        if (!isCompatElement(value) || typeof value.type !== 'string' || value.type !== this.element.type || isRawHTML(value) !== this.rawHTML) {
            return false;
        }
        const namespace = environment.namespace === 'svg' || value.type === 'svg' ? 'svg' : 'html';
        return namespace === this.namespace;
    }

    public update(value: ReactNode, environment: ReconcileEnvironment): void {
        if (!isCompatElement(value) || this.disposed) return;
        const previous = this.element;
        this.element = value;
        this.environment = environment;
        this.classSource.updateIfChanged(normalizeClassName(value.props.className ?? value.props.class));
        this.styleSource.updateIfChanged(serializeStyle(value.props.style));

        if (this.node) this.patchNode(previous.props, value.props, false);
        if (!this.rawHTML) {
            this.children = reconcileChildren(this.children, value.props.children, this.childEnvironment(), this.source);
        } else if (this.node) {
            this.applyRawHTML(value.props.dangerouslySetInnerHTML);
        }
        if (this.node) this.patchControlledProps(value.props, false);

        if (previous.ref !== value.ref && this.node) {
            clearRef(previous.ref, this.refCleanup);
            this.refCleanup = setRef(value.ref, this.node);
        }
    }

    private childEnvironment(): ReconcileEnvironment {
        const namespace = this.namespace === 'svg' && this.element.type !== 'foreignObject' ? 'svg' : 'html';
        return { contexts: this.environment.contexts, namespace };
    }

    private attachNode(node: HTMLElement | SVGElement | undefined): void {
        if (!node || this.disposed) return;
        this.node = node;
        this.patchNode({}, this.element.props, true);
        if (this.rawHTML) this.applyRawHTML(this.element.props.dangerouslySetInnerHTML);
        this.patchControlledProps(this.element.props, true);
        pendingControlledHosts.add(this);
        this.refCleanup = setRef(this.element.ref, node);
        if (this.element.props.autoFocus && node instanceof HTMLElement) node.focus();
    }

    private detachNode(): void {
        if (!this.node) return;
        clearRef(this.element.ref, this.refCleanup);
        this.refCleanup = undefined;
        for (const binding of this.events.values()) {
            this.node.removeEventListener(binding.eventName, binding.listener, binding.capture);
        }
        this.events.clear();
        this.node = undefined;
    }

    private patchNode(previous: Record<string, any>, next: Record<string, any>, initial: boolean): void {
        if (!this.node) return;
        for (const key of Object.keys(previous)) {
            if (ignoredProp(key) || key === 'className' || key === 'class' || key === 'style' || key === 'dangerouslySetInnerHTML') continue;
            if (!(key in next) || next[key] == null) this.patchProperty(key, previous[key], undefined, initial);
        }
        for (const key of Object.keys(next)) {
            if (ignoredProp(key) || key === 'className' || key === 'class' || key === 'style' || key === 'dangerouslySetInnerHTML') continue;
            if (key === 'value' || key === 'checked' || key === 'defaultValue' || key === 'defaultChecked') continue;
            if (initial || !Object.is(previous[key], next[key])) this.patchProperty(key, previous[key], next[key], initial);
        }
        if (!Object.is(previous.type, next.type) && typeof next.onChange === 'function') this.patchEvent('onChange', next.onChange);
        if (this.namespace === 'svg') this.node.setAttribute('class', normalizeClassName(next.className ?? next.class));
    }

    private patchProperty(key: string, previous: unknown, next: unknown, initial: boolean): void {
        if (!this.node) return;
        if (isEventProp(key)) {
            this.patchEvent(key, next);
            return;
        }
        if (typeof next === 'function') return;
        setDOMProperty(this.node, key, next, this.namespace, initial, previous);
    }

    private patchEvent(propName: string, value: unknown): void {
        if (!this.node) return;
        const description = eventDescription(propName, this.element.type, this.element.props);
        const existing = this.events.get(propName);
        if (existing && (existing.eventName !== description.eventName || existing.capture !== description.capture || typeof value !== 'function')) {
            this.node.removeEventListener(existing.eventName, existing.listener, existing.capture);
            this.events.delete(propName);
        }
        if (typeof value !== 'function') return;
        const retained = this.events.get(propName);
        if (retained) {
            retained.handler = value as (event: Event) => unknown;
            return;
        }
        const binding = {} as EventBinding;
        binding.eventName = description.eventName;
        binding.capture = description.capture;
        binding.handler = value as (event: Event) => unknown;
        binding.listener = (event: Event): void => {
            const selection = captureSelection(this.node);
            decorateEvent(event);
            batchedUpdates(() => binding.handler(event));
            // Controlled fields snap back even when the callback declines to
            // publish a new value. If it did update state, `this.element` now
            // contains that reconciled value and the same pass is a no-op.
            this.patchControlledProps(this.element.props, false);
            restoreSelection(this.node, selection);
        };
        this.events.set(propName, binding);
        this.node.addEventListener(binding.eventName, binding.listener, binding.capture);
    }

    private patchControlledProps(props: Record<string, any>, initial: boolean): void {
        if (!this.node) return;
        const node = this.node as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if ('defaultValue' in props && props.defaultValue !== undefined) {
            const value = normalizeFormValue(props.defaultValue);
            if (node instanceof HTMLSelectElement) {
                const defaults = new Set((Array.isArray(props.defaultValue) ? props.defaultValue : [props.defaultValue]).map(String));
                for (const option of Array.from(node.options)) option.defaultSelected = defaults.has(option.value);
                if (initial && props.value === undefined) {
                    for (const option of Array.from(node.options)) option.selected = defaults.has(option.value);
                }
            } else {
                node.defaultValue = value;
                if (initial && props.value === undefined && node.value !== value) node.value = value;
            }
        }
        if ('defaultChecked' in props && props.defaultChecked !== undefined && this.node instanceof HTMLInputElement) {
            this.node.defaultChecked = Boolean(props.defaultChecked);
            if (initial && props.checked === undefined) this.node.checked = Boolean(props.defaultChecked);
        }
        if ('value' in props && props.value !== undefined && 'value' in node) {
            if (this.node instanceof HTMLSelectElement && this.node.multiple && Array.isArray(props.value)) {
                const selected = new Set(props.value.map(String));
                for (const option of Array.from(this.node.options)) option.selected = selected.has(option.value);
            } else {
                const value = normalizeFormValue(props.value);
                if (node.value !== value) node.value = value;
            }
        }
        if ('checked' in props && props.checked !== undefined && this.node instanceof HTMLInputElement) {
            const checked = Boolean(props.checked);
            if (this.node.checked !== checked) this.node.checked = checked;
        }
    }

    public finalizeControlledProps(): void {
        if (!this.disposed && this.node) this.patchControlledProps(this.element.props, true);
    }

    private applyRawHTML(value: { __html?: unknown } | undefined): void {
        if (!this.node) return;
        const html = value?.__html == null ? '' : String(value.__html);
        if (this.node.innerHTML !== html) this.node.innerHTML = html;
    }

    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        pendingControlledHosts.delete(this);
        this.detachNode();
        for (const child of this.children) child.dispose();
        this.children = [];
    }
}

function ignoredProp(key: string): boolean {
    return key === 'children' || key === 'key' || key === 'ref' || key === 'suppressContentEditableWarning' || key === 'suppressHydrationWarning';
}

function normalizeClassName(value: unknown): string {
    if (value == null || value === false) return '';
    if (Array.isArray(value)) return value.filter(Boolean).join(' ');
    if (typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>).filter((key) => Boolean((value as Record<string, unknown>)[key])).join(' ');
    }
    return String(value);
}

const unitlessCSSProperties = new Set([
    'animationIterationCount', 'aspectRatio', 'borderImageOutset', 'borderImageSlice', 'borderImageWidth', 'boxFlex',
    'boxFlexGroup', 'boxOrdinalGroup', 'columnCount', 'columns', 'fillOpacity', 'flex', 'flexGrow', 'flexNegative',
    'flexOrder', 'flexPositive', 'flexShrink', 'floodOpacity', 'fontWeight', 'gridArea', 'gridColumn', 'gridColumnEnd',
    'gridColumnSpan', 'gridColumnStart', 'gridRow', 'gridRowEnd', 'gridRowSpan', 'gridRowStart', 'lineClamp', 'lineHeight',
    'opacity', 'order', 'orphans', 'scale', 'stopOpacity', 'strokeDasharray', 'strokeDashoffset', 'strokeMiterlimit',
    'strokeOpacity', 'strokeWidth', 'tabSize', 'widows', 'zIndex', 'zoom'
]);

function cssPropertyName(property: string): string {
    if (property.startsWith('--')) return property;
    const kebab = property.replace(/([A-Z])/g, '-$1').toLowerCase();
    return kebab.startsWith('ms-') ? `-${kebab}` : kebab;
}

function serializeStyle(value: unknown): string {
    if (value == null || value === false) return '';
    if (typeof value === 'string') return value;
    if (typeof value !== 'object') return String(value);
    const declarations: string[] = [];
    for (const [property, raw] of Object.entries(value as Record<string, unknown>)) {
        if (raw == null || raw === '' || typeof raw === 'boolean') continue;
        const normalized = typeof raw === 'number' && raw !== 0 && !unitlessCSSProperties.has(property) && !property.startsWith('--')
            ? `${raw}px`
            : String(raw);
        declarations.push(`${cssPropertyName(property)}:${normalized}`);
    }
    return declarations.join(';');
}

const propertyAliases: Record<string, string> = {
    acceptCharset: 'accept-charset',
    charSet: 'charset',
    className: 'class',
    htmlFor: 'for',
    httpEquiv: 'http-equiv'
};

const svgPreservedCase = new Set(['viewBox', 'preserveAspectRatio', 'gradientUnits', 'markerHeight', 'markerWidth', 'refX', 'refY', 'textLength']);

function attributeName(key: string, namespace: Namespace): string {
    const alias = propertyAliases[key];
    if (alias) return alias;
    if (key === 'xlinkHref') return 'xlink:href';
    if (namespace === 'svg' && !svgPreservedCase.has(key)) return key.replace(/([A-Z])/g, '-$1').toLowerCase();
    return key;
}

const booleanProperties = new Set([
    'allowFullScreen', 'async', 'autoFocus', 'autoPlay', 'checked', 'controls', 'default', 'defer', 'disabled', 'formNoValidate',
    'hidden', 'inert', 'itemScope', 'loop', 'multiple', 'muted', 'noModule', 'noValidate', 'open', 'playsInline', 'readOnly',
    'required', 'reversed', 'selected'
]);
const enumeratedBooleanProperties = new Set(['contentEditable', 'draggable', 'spellCheck', 'translate']);

function setDOMProperty(
    node: HTMLElement | SVGElement,
    key: string,
    value: unknown,
    namespace: Namespace,
    _initial: boolean,
    _previous: unknown
): void {
    const name = attributeName(key, namespace);
    const stringBooleanAttribute = key.startsWith('aria-') || key.startsWith('data-');
    if (value == null) {
        node.removeAttribute(name);
        if (namespace === 'html' && booleanProperties.has(key) && key in node) {
            try {
                (node as unknown as Record<string, unknown>)[key] = false;
            } catch {}
        }
        return;
    }

    if (value === false && !stringBooleanAttribute) {
        if (namespace === 'html' && enumeratedBooleanProperties.has(key) && key in node) {
            try {
                (node as unknown as Record<string, unknown>)[key] = false;
                return;
            } catch {}
        }
        if (namespace === 'html' && enumeratedBooleanProperties.has(key)) {
            node.setAttribute(name, 'false');
            return;
        }
        node.removeAttribute(name);
        if (namespace === 'html' && booleanProperties.has(key) && key in node) {
            try {
                (node as unknown as Record<string, unknown>)[key] = false;
            } catch {}
        }
        return;
    }

    if (namespace === 'html' && !key.startsWith('aria-') && !key.startsWith('data-') && key in node) {
        try {
            (node as unknown as Record<string, unknown>)[key] = value;
            return;
        } catch {}
    }

    if (typeof value === 'boolean') node.setAttribute(name, stringBooleanAttribute ? String(value) : '');
    else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') node.setAttribute(name, String(value));
}

function isEventProp(key: string): boolean {
    return /^on[A-Z]/.test(key) && key !== 'onAttach' && key !== 'onDetach';
}

function eventDescription(propName: string, tag: string, props: Record<string, any>): { eventName: string; capture: boolean } {
    let name = propName.slice(2);
    let capture = false;
    if (name.endsWith('Capture')) {
        name = name.slice(0, -7);
        capture = true;
    }
    if (name === 'DoubleClick' || name === 'DblClick') return { eventName: 'dblclick', capture };
    if (name === 'Change') {
        if (tag === 'textarea') return { eventName: 'input', capture };
        if (tag === 'input') {
            const type = String(props.type ?? 'text').toLowerCase();
            const usesChange = type === 'checkbox' || type === 'radio' || type === 'file';
            return { eventName: usesChange ? 'change' : 'input', capture };
        }
        return { eventName: 'change', capture };
    }
    return { eventName: name.toLowerCase(), capture };
}

function decorateEvent(event: Event): void {
    const extensible = Object.isExtensible(event);
    if (!extensible) return;
    const target = event as Event & Record<string, unknown>;
    if (!('nativeEvent' in target)) Object.defineProperty(target, 'nativeEvent', { value: event, configurable: true });
    if (!('persist' in target)) Object.defineProperty(target, 'persist', { value: (): void => undefined, configurable: true });
    if (!('isDefaultPrevented' in target)) {
        Object.defineProperty(target, 'isDefaultPrevented', { value: (): boolean => event.defaultPrevented, configurable: true });
    }
    if (!('isPropagationStopped' in target)) {
        Object.defineProperty(target, 'isPropagationStopped', { value: (): boolean => event.cancelBubble, configurable: true });
    }
}

interface SelectionSnapshot {
    readonly start: number | null;
    readonly end: number | null;
    readonly direction: 'forward' | 'backward' | 'none' | null;
}

function captureSelection(node: HTMLElement | SVGElement | undefined): SelectionSnapshot | undefined {
    if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) || document.activeElement !== node) return undefined;
    return { start: node.selectionStart, end: node.selectionEnd, direction: node.selectionDirection };
}

function restoreSelection(node: HTMLElement | SVGElement | undefined, selection: SelectionSnapshot | undefined): void {
    if (!selection || !(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) || document.activeElement !== node) return;
    if (selection.start == null || selection.end == null) return;
    const length = node.value.length;
    try {
        node.setSelectionRange(Math.min(selection.start, length), Math.min(selection.end, length), selection.direction ?? undefined);
    } catch {}
}

function normalizeFormValue(value: unknown): string {
    if (Array.isArray(value)) return value.length === 0 ? '' : String(value[0]);
    return value == null ? '' : String(value);
}

function CompatRootBoundary(props: { root: CompatRoot }, _children: NativeRenderable[], api: AurumComponentAPI): NativeRenderable {
    api.onDetach(() => props.root.handleNativeDetach());
    return props.root.source;
}

export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
}

class CompatRoot implements Root {
    public readonly source = new ArrayDataSource<NativeRenderable>([], 'Compat root children');
    private children: MountedNode[] = [];
    private token?: CancellationToken;
    private unmounted = false;
    private disposing = false;

    public constructor(private readonly container: HTMLElement) {}

    public render(children: ReactNode): void {
        if (this.unmounted) throw new Error('Cannot render into an unmounted Aurum compat root');
        performWork(() => {
            this.children = reconcileChildren(
                this.children,
                children,
                { contexts: EMPTY_CONTEXT, namespace: 'html' },
                this.source
            );
            if (!this.token) {
                this.container.replaceChildren();
                const model = NativeAurum.factory(CompatRootBoundary, { root: this }) as NativeRenderable;
                this.token = NativeAurum.attach(model, this.container);
            }
        });
    }

    public unmount(): void {
        if (this.unmounted) return;
        this.unmounted = true;
        performWork(() => {
            if (this.token) this.token.cancel();
            else this.disposeChildren();
            this.token = undefined;
        });
    }

    public handleNativeDetach(): void {
        this.disposeChildren();
    }

    private disposeChildren(): void {
        if (this.disposing) return;
        this.disposing = true;
        for (const child of this.children) child.dispose();
        this.children = [];
        this.disposing = false;
    }
}

export function createRoot(container: HTMLElement): Root {
    if (!(container instanceof HTMLElement)) throw new TypeError('createRoot expected an HTMLElement container');
    return new CompatRoot(container);
}

export function flushSync<T>(callback: () => T): T {
    return performWork(() => batchedUpdates(callback));
}

export function act(callback: () => void): void;
export function act<T>(callback: () => Promise<T>): Promise<void>;
export function act<T>(callback: () => T | Promise<T>): void | Promise<void> {
    let result: T | Promise<T>;
    result = batchedUpdates(callback);
    if (result && typeof (result as Promise<T>).then === 'function') {
        return (result as Promise<T>).then(async () => {
            performWork(() => {
                flushPendingRenders();
                flushLayoutEffects();
                flushPassiveEffects();
            });
            await Promise.resolve();
            performWork(() => flushPassiveEffects());
        });
    }
    performWork(() => {
        flushPendingRenders();
        flushLayoutEffects();
        flushPassiveEffects();
    });
}

/** Internal test hook; kept out of the public declarations by convention only. */
export function flushCompatEffects(): void {
    performWork(() => {
        flushPendingRenders();
        flushLayoutEffects();
        flushPassiveEffects();
    });
}
