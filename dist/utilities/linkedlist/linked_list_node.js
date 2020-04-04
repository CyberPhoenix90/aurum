/**
 * @internal
 */
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
            if (this.next) {
                this.next.previous = this;
            }
        }
    }
    deletePrevious() {
        if (this.previous) {
            const overPrevious = this.previous.previous;
            this.previous.next = undefined;
            this.previous.previous = undefined;
            this.previous = overPrevious;
            if (this.previous) {
                this.previous.next = this;
            }
        }
    }
}
//# sourceMappingURL=linked_list_node.js.map