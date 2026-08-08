import type { CompatElement, ComponentType, Key, ReactNode, Ref } from './types.js';

export const COMPAT_ELEMENT = Symbol.for('@aurum/compat.element');
export const Fragment = Symbol.for('@aurum/compat.fragment');
export const PORTAL = Symbol.for('@aurum/compat.portal');
export const MEMO = Symbol.for('@aurum/compat.memo');
export const FORWARD_REF = Symbol.for('@aurum/compat.forward-ref');
export const CONTEXT_PROVIDER = Symbol.for('@aurum/compat.context-provider');

export interface InternalCompatElement<P = any, T = any> extends CompatElement<P, T> {
    readonly $$typeof: typeof COMPAT_ELEMENT;
}

export interface MemoMetadata<P = any> {
    readonly component: ComponentType<P>;
    readonly compare?: (previous: Readonly<P>, next: Readonly<P>) => boolean;
}

export interface ForwardRefMetadata<T = any, P = {}> {
    readonly render: (props: P, ref: Ref<T>) => ReactNode;
}

export interface MarkedComponent extends Function {
    [MEMO]?: MemoMetadata<any>;
    [FORWARD_REF]?: ForwardRefMetadata<any, any>;
    [CONTEXT_PROVIDER]?: unknown;
}

function makeElement(type: any, inputProps: Record<string, any> | null | undefined, explicitKey?: Key): InternalCompatElement {
    const props = inputProps == null ? {} : { ...inputProps };
    const key = explicitKey !== undefined ? explicitKey : (props.key as Key | null | undefined);
    const ref = (props.ref as Ref<any> | undefined) ?? null;
    delete props.key;
    delete props.ref;

    return {
        $$typeof: COMPAT_ELEMENT,
        type,
        key: key == null ? null : key,
        ref,
        props
    };
}

/** Automatic JSX production entry point. */
export function jsx(type: any, props: Record<string, any> | null, key?: Key): InternalCompatElement {
    return makeElement(type, props, key);
}

/** Automatic JSX production entry point used for elements with static children. */
export const jsxs = jsx;

/** Development automatic JSX entry point. Source metadata is intentionally ignored. */
export function jsxDEV(
    type: any,
    props: Record<string, any> | null,
    key: Key | undefined,
    _isStaticChildren?: boolean,
    _source?: unknown,
    _self?: unknown
): InternalCompatElement {
    return makeElement(type, props, key);
}

/** Classic JSX/createElement entry point for migration code that still calls it directly. */
export function createElement(type: any, props: Record<string, any> | null, ...children: ReactNode[]): InternalCompatElement {
    const nextProps = props == null ? {} : { ...props };
    if (children.length === 1) nextProps.children = children[0];
    else if (children.length > 1) nextProps.children = children;
    return makeElement(type, nextProps);
}

export function isValidElement(value: unknown): value is CompatElement {
    return isCompatElement(value);
}

export function isCompatElement(value: unknown): value is InternalCompatElement {
    return typeof value === 'object' && value !== null && (value as InternalCompatElement).$$typeof === COMPAT_ELEMENT;
}

export function cloneElement<P>(element: CompatElement<P>, props?: Partial<P> & { key?: Key; ref?: Ref<any> }, ...children: ReactNode[]): CompatElement<P> {
    if (!isCompatElement(element)) throw new TypeError('cloneElement expected a compat JSX element');
    const nextProps: Record<string, any> = { ...(element.props as Record<string, any>), ...(props as Record<string, any> | undefined) };
    if (props?.key === undefined && element.key !== null) nextProps.key = element.key;
    if (props?.ref === undefined && element.ref !== null) nextProps.ref = element.ref;
    if (children.length === 1) nextProps.children = children[0];
    else if (children.length > 1) nextProps.children = children;
    return makeElement(element.type, nextProps) as CompatElement<P>;
}

export function StrictMode(props: { children?: ReactNode }): ReactNode {
    return props.children;
}

function flattenChildren(children: ReactNode, target: ReactNode[]): void {
    if (children == null || typeof children === 'boolean') return;
    if (Array.isArray(children)) {
        for (const child of children) flattenChildren(child, target);
        return;
    }
    if (typeof children !== 'string' && typeof children === 'object' && !isCompatElement(children) && Symbol.iterator in children) {
        for (const child of children as Iterable<ReactNode>) flattenChildren(child, target);
        return;
    }
    target.push(children);
}

export const Children = {
    toArray(children: ReactNode): ReactNode[] {
        const result: ReactNode[] = [];
        flattenChildren(children, result);
        return result;
    },
    count(children: ReactNode): number {
        return this.toArray(children).length;
    },
    map<T>(children: ReactNode, mapper: (child: ReactNode, index: number) => T): T[] {
        return this.toArray(children).map(mapper);
    },
    forEach(children: ReactNode, callback: (child: ReactNode, index: number) => void): void {
        this.toArray(children).forEach(callback);
    },
    only(children: ReactNode): ReactNode {
        const array = this.toArray(children);
        if (array.length !== 1) throw new Error('Children.only expected exactly one child');
        return array[0];
    }
};
