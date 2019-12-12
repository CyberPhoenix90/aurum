declare type SupportedNodeTypes = HTMLElement | DocumentFragment | Text;
export interface DocumentFragmentMeta {
    parent: HTMLElement | DocumentFragment;
    children: SupportedNodeTypes[];
    atParentIndex: number;
}
export declare class DomAPIWrapper {
    static getText(node: SupportedNodeTypes): string;
    static setText(node: SupportedNodeTypes, value: string): void;
    static getParent(node: SupportedNodeTypes): HTMLElement;
    static removeChild(node: SupportedNodeTypes, child: SupportedNodeTypes): void;
    static getChildren(node: SupportedNodeTypes): any;
    static isConnected(node: SupportedNodeTypes): boolean;
    static appendChild(node: SupportedNodeTypes, child: SupportedNodeTypes): void;
}
export {};
//# sourceMappingURL=dom_api_wrapper.d.ts.map