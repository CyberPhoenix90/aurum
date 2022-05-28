export enum VDomNodeType {
    CONTAINER = 0,
    STATIC = 1,
    DYNAMIC = 2
}

export enum VDomNodeState {
    CREATED = 0,
    RENDERED = 1,
    ATTACHED = 1,
    DETACHED = 2
}

export interface VDomContainerNode {
    parent: VDomNode<any>;
    staticParent: VDomStaticNode<any>;
    type: VDomNodeType.CONTAINER;
    children: VDomNode<any>[];
}

export interface VDomStaticNode<T = any> {
    type: VDomNodeType.STATIC;
    state: VDomNodeState;
    staticParent: VDomStaticNode<any>;
    parent: VDomNode<any>;
    children?: VDomNode<any>[];
    plugin: symbol;
    inputData: T;
    renderData?: T;
}

export interface VDomDynamicNode<T = any> {
    parent: VDomNode<any>;
    staticParent: VDomStaticNode<any>;
    type: VDomNodeType.DYNAMIC;
    dataSource: T;
    children: VDomNode<any>[];
}

export type VDomNode<T> = VDomStaticNode<T> | VDomDynamicNode<T> | VDomContainerNode;
