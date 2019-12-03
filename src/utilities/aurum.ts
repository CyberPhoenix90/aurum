import { AurumElement, Template } from '../nodes/aurum_element';
import { ownerSymbol } from './owner_symbol';
import { Constructor, MapLike } from './common';

export class Aurum {
	public static attach(aurumElement: AurumElement, dom: HTMLElement) {
		if (dom[ownerSymbol]) {
			throw new Error('This node is already managed by aurum and cannot be used');
		}
		dom.appendChild(aurumElement.node);
		aurumElement['handleAttach']();
		dom[ownerSymbol] = aurumElement;
	}

	public static detach(domNode: HTMLElement): void {
		if (domNode[ownerSymbol]) {
			domNode[ownerSymbol].node.remove();
			domNode[ownerSymbol].handleDetach();
			domNode[ownerSymbol].dispose();
			domNode[ownerSymbol] = undefined;
		}
	}

	public static factory(
		node: Constructor<AurumElement> | ((...args: any[]) => AurumElement),
		args: MapLike<any>,
		...innerNodes: AurumElement[]
	): AurumElement {
		if (typeof node === 'string') {
			return;
		}

		const children = [].concat(...innerNodes).filter((e) => e);
		const templateMap = {};
		let defaultTemplate;
		let hasRef: boolean = false;
		for (const c of children) {
			if (typeof c === 'string') {
				continue;
			}
			if (c instanceof Template && (!c.ref || c.ref === 'default')) {
				defaultTemplate = c;
			}

			if (c.ref) {
				templateMap[c.ref] = c;
				hasRef = true;
			}
		}

		args = args ?? {};
		if (defaultTemplate) {
			args.template = defaultTemplate;
		}
		if (hasRef) {
			args.templateMap = templateMap;
		}

		let instance: AurumElement;
		if (node.prototype) {
			//@ts-ignore
			instance = new node(args || {});
		} else {
			//@ts-ignore
			instance = node(args || {});
		}
		instance.addChildren(children);

		return instance;
	}
}
