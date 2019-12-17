/**
 * @internal
 */
export class LinkedListNode<T> {
	public next: LinkedListNode<T>;
	public previous: LinkedListNode<T>;
	public data: T;

	constructor(data: T) {
		this.data = data;
	}

	public deleteNext() {
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

	public deletePrevious() {
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
