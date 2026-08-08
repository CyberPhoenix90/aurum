import { CancellationToken, DataSource, EventEmitter, ReadOnlyArrayDataSource, ReadOnlyDataSource } from '@aurum/streams';
import { getAurumDevtoolsActiveComponent, traceAurumComponentRender } from '../devtools.js';

export type RenderablePrimitive = string | number | bigint | boolean | null | undefined;

/**
 * A renderer-independent value accepted from components. Arrays, promises,
 * and reactive sources are recursive so the type reflects the values accepted
 * by every Aurum renderer at runtime.
 */
export type Renderable =
    | RenderablePrimitive
    | AurumElementModel<any>
    | ReadOnlyDataSource<Renderable>
    | ReadOnlyArrayDataSource<Renderable>
    | Promise<Renderable>
    | Renderable[];

export type ComponentResult = Renderable;

export type AurumComponent<Props, Prerendered = Renderable> = (
    props: Props,
    children: Renderable[],
    api: AurumComponentAPI<Prerendered>
) => ComponentResult;

const aurumContextIdentity = Symbol('AurumContext');

/** A renderer-independent value inherited by descendant components. */
export interface AurumContext<T> {
    readonly [aurumContextIdentity]: true;
    readonly defaultValue: T;
    readonly Provider: AurumComponent<{ value: T }>;
}

/** Creates a context whose provider scopes a value to its rendered descendants. */
export function createContext<T>(defaultValue: T): AurumContext<T> {
    const context = {
        [aurumContextIdentity]: true as const,
        defaultValue,
        Provider(props: { value: T }, children: Renderable[], api: AurumComponentAPI): Renderable {
            api.provideContext(context, props.value);
            return children;
        }
    };
    return context;
}

export const aurumElementModelIdentitiy = Symbol('AurumElementModel');

export interface AurumElementModel<Props, Result = ComponentResult> {
    [aurumElementModelIdentitiy]: boolean;
    props: Props;
    name: string;
    isIntrinsic: boolean;
    children: Renderable[];
    factory(props: Props, children: Renderable[], api: AurumComponentAPI): Result;
}

export const nodeData = new WeakMap<object, AurumNodeData>();

export interface AurumNodeData {}

export interface ComponentLifeCycle {
    onAttach(): void;
    onDetach(): void;
}

export interface ComponentLifeCycleInternal extends ComponentLifeCycle {
    attach: EventEmitter<void>;
    detach: EventEmitter<void>;
}

/** @internal Makes component handles invariant so their exposed contract cannot be widened accidentally. */
const componentHandleType = Symbol('AurumComponentHandleType');

/** A lifecycle-aware, read-only source containing the public API explicitly exposed by a component. */
export interface ComponentHandle<T> extends ReadOnlyDataSource<T | undefined> {
    /** @internal Type-only invariant marker. */
    readonly [componentHandleType]: (value: T) => T;
}

interface ComponentHandleState<T> {
    source: DataSource<T | undefined>;
    owner?: object;
}

const componentHandleStates = new WeakMap<object, ComponentHandleState<any>>();

/** Creates a read-only handle that a component can populate through `api.expose`. */
export function createComponentHandle<T>(name: string = 'Component Handle'): ComponentHandle<T> {
    const source = new DataSource<T | undefined>(undefined, name);
    Object.defineProperty(source, componentHandleType, {
        value: (value: T): T => value,
        enumerable: false
    });
    const handle = source as unknown as ComponentHandle<T>;
    componentHandleStates.set(handle, { source });
    return handle;
}

export interface AurumComponentAPI<Prerendered = Renderable> {
    synchronizeLifeCycle(lifeCycle: ComponentLifeCycle): void;
    onAttach(cb: () => void): void;
    onDetach(cb: () => void): void;
    /** Publishes a component's explicit public API while it is attached and clears it on detach. */
    expose<T>(handle: ComponentHandle<T> | undefined, value: NoInfer<T>): void;
    /** Makes a context value available to components rendered below this component. */
    provideContext<T>(context: AurumContext<T>, value: T): void;
    /** Reads the nearest provided value, or the context's default value. */
    readContext<T>(context: AurumContext<T>): T;
    readonly cancellationToken: CancellationToken;
    /** @internal Renderer session used by intrinsic host factories. */
    readonly renderSession: RenderSession;
    prerender(children: Renderable[], lifeCycle: ComponentLifeCycle): Prerendered[];
    prerender(child: Renderable, lifeCycle: ComponentLifeCycle): Prerendered;
}

/** @internal */
export interface RenderSession {
    attachCalls: Array<() => void>;
    tokens: CancellationToken[];
    sessionToken: CancellationToken;
    /** @internal Strong references for debug-only component inspection records. */
    devtoolsTargets: object[];
    /** @internal Components synchronously being evaluated in this render session. */
    devtoolsComponentStack?: object[];
    /** @internal Component inherited by a child render session or deferred render scope. */
    devtoolsParentComponent?: object;
    /** @internal Context values inherited by descendant component sessions. */
    contextValues: Map<AurumContext<unknown>, unknown>;
}

export type PrerenderStrategy<Prerendered = Renderable> = (
    target: Renderable,
    session: RenderSession
) => Prerendered | Prerendered[];

export function createRenderSession(parentSession?: RenderSession): RenderSession {
    const parentStack = parentSession?.devtoolsComponentStack;
    const devtoolsParentComponent =
        parentStack && parentStack.length > 0
            ? parentStack[parentStack.length - 1]
            : parentSession?.devtoolsParentComponent;
    const session: RenderSession = {
        attachCalls: [],
        sessionToken: new CancellationToken(() => {
            for (const token of session.tokens) token.cancel();
            session.devtoolsTargets.length = 0;
            if (session.devtoolsComponentStack) session.devtoolsComponentStack.length = 0;
            session.devtoolsParentComponent = undefined;
        }),
        tokens: [],
        devtoolsTargets: [],
        devtoolsParentComponent,
        contextValues: new Map(parentSession?.contextValues)
    };
    return session;
}

export function createLifeCycle(): ComponentLifeCycle {
    const lifeCycle = {
        attach: new EventEmitter<void>(),
        detach: new EventEmitter<void>(),
        onAttach(): void {
            lifeCycle.attach.fire();
        },
        onDetach(): void {
            lifeCycle.detach.fire();
        }
    } as ComponentLifeCycleInternal;
    return lifeCycle;
}

/**
 * Creates the API passed to a component. A renderer may supply a prerender
 * strategy for its native output; the default only evaluates components and
 * deliberately leaves intrinsic models untouched.
 */
export function createAPI<Prerendered = Renderable>(
    session: RenderSession,
    prerenderStrategy: PrerenderStrategy<Prerendered> = prerenderComponents as PrerenderStrategy<Prerendered>
): AurumComponentAPI<Prerendered> {
    return new DefaultAurumComponentAPI(session, prerenderStrategy);
}

class DefaultAurumComponentAPI<Prerendered> implements AurumComponentAPI<Prerendered> {
    private token?: CancellationToken;
    private readonly devtoolsOwner?: object;

    public constructor(
        public readonly renderSession: RenderSession,
        private readonly prerenderStrategy: PrerenderStrategy<Prerendered>
    ) {
        this.devtoolsOwner = getAurumDevtoolsActiveComponent(renderSession);
    }

    public synchronizeLifeCycle(lifeCycle: ComponentLifeCycle): void {
        this.onAttach(() => lifeCycle.onAttach());
        this.onDetach(() => lifeCycle.onDetach());
    }

    public onAttach(cb: () => void): void {
        this.renderSession.attachCalls.push(cb);
    }

    public onDetach(cb: () => void): void {
        this.cancellationToken.addCancellable(cb);
    }

    public expose<T>(handle: ComponentHandle<T> | undefined, value: NoInfer<T>): void {
        if (!handle) return;
        const state = componentHandleStates.get(handle);
        if (!state) throw new Error('api.expose only accepts handles created by createComponentHandle');
        const owner = {};
        this.onAttach(() => {
            state.owner = owner;
            state.source.update(value);
        });
        this.onDetach(() => {
            if (state.owner === owner) {
                state.owner = undefined;
                state.source.update(undefined);
            }
        });
    }

    public provideContext<T>(context: AurumContext<T>, value: T): void {
        if (context?.[aurumContextIdentity] !== true) {
            throw new Error('provideContext only accepts contexts created by createContext');
        }
        this.renderSession.contextValues.set(context as AurumContext<unknown>, value);
    }

    public readContext<T>(context: AurumContext<T>): T {
        if (context?.[aurumContextIdentity] !== true) {
            throw new Error('readContext only accepts contexts created by createContext');
        }
        return this.renderSession.contextValues.has(context as AurumContext<unknown>)
            ? (this.renderSession.contextValues.get(context as AurumContext<unknown>) as T)
            : context.defaultValue;
    }

    public get cancellationToken(): CancellationToken {
        if (!this.token) {
            this.token = new CancellationToken();
            this.renderSession.tokens.push(this.token);
        }
        return this.token;
    }

    public prerender(target: Renderable[], lifeCycle: ComponentLifeCycle): Prerendered[];
    public prerender(target: Renderable, lifeCycle: ComponentLifeCycle): Prerendered;
    public prerender(target: Renderable, lifeCycle: ComponentLifeCycle): Prerendered | Prerendered[] {
        const internalLifeCycle = lifeCycle as ComponentLifeCycleInternal;
        const subSession = createRenderSession(this.renderSession);
        if (this.devtoolsOwner) subSession.devtoolsParentComponent = this.devtoolsOwner;
        const result = this.prerenderStrategy(target, subSession);
        internalLifeCycle.attach.subscribeOnce(() => {
            for (const cb of subSession.attachCalls) cb();
        });
        internalLifeCycle.detach.subscribeOnce(() => {
            internalLifeCycle.attach.cancelAll();
            subSession.sessionToken.cancel();
        });
        return result;
    }
}

export function prerenderComponents(target: Renderable, session: RenderSession): Renderable {
    if (target === undefined || target === null) return target;
    if (Array.isArray(target)) {
        const result: Renderable[] = [];
        for (const item of target) {
            const rendered = prerenderComponents(item, session);
            if (rendered === undefined || rendered === null) continue;
            if (Array.isArray(rendered)) result.push(...rendered);
            else result.push(rendered);
        }
        return result;
    }
    const model = target as AurumElementModel<any>;
    if (!model?.[aurumElementModelIdentitiy] || model.isIntrinsic) return target;
    return traceAurumComponentRender(model, session, () =>
        prerenderComponents(model.factory(model.props ?? {}, model.children, createAPI(session, prerenderComponents)), session)
    );
}
