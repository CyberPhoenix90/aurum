import { LinkedListNode } from './linked_list_node';
export class LinkedList {
    constructor(data = []) {
        this.length = 0;
        data.forEach((d) => this.append(d));
    }
    find(predicate) {
        let ptr = this.rootNode;
        while (ptr && !predicate(ptr)) {
            ptr = ptr.next;
        }
        return ptr;
    }
    append(element) {
        if (!this.rootNode && !this.lastNode) {
            this.rootNode = this.lastNode = new LinkedListNode(element);
        }
        else {
            this.lastNode.next = new LinkedListNode(element);
            this.lastNode.next.previous = this.lastNode;
            this.lastNode = this.lastNode.next;
        }
        this.length++;
        return element;
    }
    forEach(cb) {
        this.find((n) => {
            cb(n.data);
            return false;
        });
    }
    prepend(element) {
        if (!this.rootNode && !this.lastNode) {
            this.rootNode = this.lastNode = new LinkedListNode(element);
        }
        else {
            this.rootNode.previous = new LinkedListNode(element);
            this.rootNode.previous.next = this.rootNode;
            this.rootNode = this.rootNode.previous;
        }
        this.length++;
        return element;
    }
    remove(element) {
        if (element === this.rootNode.data) {
            if (this.rootNode === this.lastNode) {
                this.rootNode = this.lastNode = undefined;
            }
            else {
                this.rootNode = this.rootNode.next;
            }
            this.length--;
        }
        else {
            const result = this.find((e) => e.next && e.next.data === element);
            if (result) {
                if (result.next === this.lastNode) {
                    this.lastNode = result;
                }
                result.deleteNext();
                this.length--;
            }
        }
    }
}
//# sourceMappingURL=linked_list.js.map