export class LinkedListNode {
    constructor(data) {
        this.data = data;
    }
    deleteNext() {
        if (this.next) {
            const overNext = this.next.next;
            this.next.next = undefined;
            this.next.previous = undefined;
            this.next = overNext;
            this.next.previous = this;
        }
    }
    deletePrevious() {
        if (this.previous) {
            this.previous = this.previous.previous;
            this.previous.next = undefined;
            this.previous.previous = undefined;
        }
    }
}
//# sourceMappingURL=linked_list_node.js.map