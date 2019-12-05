import { LinkedList } from '../src/utilities/linkedlist/linked_list';
import { assert } from 'chai';

describe('linked list', () => {
	it('create from array', () => {
		const list = new LinkedList([1, 2, 3]);
		assert(list.rootNode.data === 1);
		assert(list.rootNode.next.data === 2);
		assert(list.rootNode.next.next.data === 3);
		assert(list.rootNode === list.lastNode.previous.previous);
		assert(list.rootNode.next === list.lastNode.previous);
		assert(list.rootNode.next.next === list.lastNode);
		assert(list.rootNode.next.previous === list.rootNode);
	});

	it('append', () => {
		const list = new LinkedList([1, 2, 3]);
		list.append(4);
		assert(list.rootNode.data === 1, 'start 1');
		assert(list.rootNode.next.data === 2, 'then 2');
		assert(list.rootNode.next.next.data === 3, 'then 3');
		assert(list.rootNode.next.next.next.data === 4, ' then 4');
		assert(list.rootNode === list.lastNode.previous.previous.previous);
		assert(list.rootNode.next === list.lastNode.previous.previous);
		assert(list.rootNode.next.next === list.lastNode.previous);
	});

	it('prepend', () => {
		const list = new LinkedList([1, 2, 3]);
		list.prepend(0);
		assert(list.rootNode.data === 0);
		assert(list.rootNode.next.data === 1);
		assert(list.rootNode.next.next.data === 2);
		assert(list.rootNode.next.next.next.data === 3);
		assert(list.rootNode === list.lastNode.previous.previous.previous);
		assert(list.rootNode.next === list.lastNode.previous.previous);
		assert(list.rootNode.next.next === list.lastNode.previous);
	});

	it('remove', () => {
		const list = new LinkedList([1, 2, 3]);
		list.remove(2);
		assert(list.rootNode.data === 1);
		assert(list.rootNode.next.data === 3);
		assert(list.rootNode === list.lastNode.previous);
		assert(list.rootNode.next === list.lastNode);
	});

	it('remove last', () => {
		const list = new LinkedList([1, 2, 3]);
		list.remove(3);
		assert(list.rootNode.data === 1);
		assert(list.rootNode.next.data === 2);
		assert(list.rootNode === list.lastNode.previous);
		assert(list.rootNode.next === list.lastNode);
	});

	it('remove all', () => {
		const list = new LinkedList([1, 2, 3]);
		list.remove(1);
		list.remove(2);
		list.remove(3);
		assert(list.rootNode === undefined);
		assert(list.lastNode === undefined);
	});
});
