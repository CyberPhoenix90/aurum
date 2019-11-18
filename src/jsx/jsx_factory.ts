import { MapLike, Constructor } from '../utilities/common';
import { AurumElement } from '../nodes/aurum_element';
import { Template } from '../nodes/template';

class JavascriptXMLSyntax {
	public deserialize(node: Constructor<AurumElement> | ((...args: any[]) => AurumElement), args: MapLike<any>, ...innerNodes: AurumElement[]): AurumElement {
		if (typeof node === 'string') {
			return;
		}
		const children = [].concat(...innerNodes).filter((e) => e);
		const refs = {};
		let hasRef: boolean = false;
		for (const c of children) {
			if (typeof c === 'string') {
				continue;
			}
			if (c instanceof Template && !c.ref) {
				refs['template'] = c;
				hasRef = true;
			}

			if (c.ref) {
				refs[c.ref] = c;
				hasRef = true;
			}
		}

		if (hasRef) {
			Object.assign(args, refs);
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

export const jsx: JavascriptXMLSyntax = new JavascriptXMLSyntax();
