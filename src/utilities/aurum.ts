import { AurumElement } from '../nodes/aurum_element';
import { ownerSymbol } from './owner_symbol';

export class Aurum {
	public static attach(node: AurumElement, dom: HTMLElement) {
		if (dom[ownerSymbol]) {
			throw new Error('This node is already managed by aurum and cannot be used');
		}
		dom.appendChild(node.node);
		dom[ownerSymbol] = node;
	}

	public static detach(domNode: HTMLElement): void {
		if (domNode[ownerSymbol]) {
			domNode[ownerSymbol].dispose();
			domNode[ownerSymbol] = undefined;
		}
	}
}
