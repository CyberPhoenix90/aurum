/**
 * @internal
 */
export declare class LinkedListNode<T> {
    next: LinkedListNode<T>;
    previous: LinkedListNode<T>;
    data: T;
    constructor(data: T);
    deleteNext(): void;
    deletePrevious(): void;
}
//# sourceMappingURL=linked_list_node.d.ts.map