import type { Renderable } from '@aurum/rendering';
import { Aurum } from './utilities/aurum.js';

export const Fragment = Aurum.fragment;

type JSXProps = Record<string, unknown> & { children?: Renderable | Renderable[] };

function normalizeChildren(children: Renderable | Renderable[] | undefined): Renderable[] {
    if (children === undefined) return [];
    return Array.isArray(children) ? children : [children];
}

function createElement(
    type: string | ((props: any, children: Renderable[], api: any) => Renderable),
    inputProps: JSXProps | null,
    key?: string | number
): Renderable {
    const props = inputProps == null ? {} : { ...inputProps };
    const children = normalizeChildren(props.children);
    delete props.children;

    if (key !== undefined) {
        Object.defineProperty(props, 'key', {
            value: key,
            enumerable: false
        });
    }

    return Aurum.factory(type, props, ...children);
}

/** Automatic JSX production entry point backed directly by Aurum element models. */
export function jsx(
    type: string | ((props: any, children: Renderable[], api: any) => Renderable),
    props: JSXProps | null,
    key?: string | number
): Renderable {
    return createElement(type, props, key);
}

/** Automatic JSX production entry point used for elements with static children. */
export const jsxs = jsx;

export namespace JSX {
    export type Element = Renderable;
    export type ElementType = keyof IntrinsicElements | ((props: any, children: Renderable[], api: any) => Renderable);

    export interface IntrinsicAttributes extends Aurum.JSX.IntrinsicAttributes {
        key?: string | number;
    }

    export interface IntrinsicElements extends Aurum.JSX.IntrinsicElements {}
}

declare global {
    namespace Aurum {
        namespace JSX {
            type Element = Renderable;
        }
    }
}
