import { LinkedListNode } from './linked_list_node';
import { Predicate } from '../common';
export declare class LinkedList<T> {
    rootNode: LinkedListNode<T>;
    lastNode: LinkedListNode<T>;
    length: number;
    constructor(data?: T[]);
    find(predicate: Predicate<LinkedListNode<T>>): LinkedListNode<T>;
    append(element: T): T;
    forEach(cb: (d: T) => void): void;
    remove(element: T): void;
}
//# sourceMappingURL=linked_list.d.ts.map