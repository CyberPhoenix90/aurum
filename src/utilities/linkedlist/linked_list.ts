import { LinkedListNode } from './linked_list_node';
import { Predicate } from '../common';

export class LinkedList<T> {
	public rootNode: LinkedListNode<T>;
	public lastNode: LinkedListNode<T>;
	public length: number;

	constructor(data: T[] = []) {
		this.length = 0;
		data.forEach((d) => this.append(d));
	}

	public find(predicate: Predicate<LinkedListNode<T>>): LinkedListNode<T> {
		let ptr: LinkedListNode<T> = this.rootNode;
		while (ptr && !predicate(ptr)) {
			ptr = ptr.next;
		}

		return ptr;
	}

	public append(element: T): T {
		if (!this.rootNode && !this.lastNode) {
			this.rootNode = this.lastNode = new LinkedListNode(element);
		} else {
			this.lastNode.next = new LinkedListNode(element);
			this.lastNode.next.previous = this.lastNode;
			this.lastNode = this.lastNode.next;
		}

		this.length++;
		return element;
	}

	public forEach(cb: (d: T) => void) {
		this.find((n) => {
			cb(n.data);
			return false;
		});
	}

	public prepend(element: T): T {
		if (!this.rootNode && !this.lastNode) {
			this.rootNode = this.lastNode = new LinkedListNode(element);
		} else {
			this.rootNode.previous = new LinkedListNode(element);
			this.rootNode.previous.next = this.rootNode;
			this.rootNode = this.rootNode.previous;
		}
		this.length++;
		return element;
	}

	public remove(element: T) {
		if (element === this.rootNode.data) {
			if (this.rootNode === this.lastNode) {
				this.rootNode = this.lastNode = undefined;
			} else {
				this.rootNode = this.rootNode.next;
			}
			this.length--;
		} else {
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
