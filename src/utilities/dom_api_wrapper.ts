const documentMeta = Symbol('DocumentFragmentMeta');
type SupportedNodeTypes = HTMLElement | DocumentFragment | Text;

export interface DocumentFragmentMeta {
	parent: HTMLElement | DocumentFragment;
	children: SupportedNodeTypes[];
	atParentIndex: number;
}

export class DomAPIWrapper {
	public static getText(node: SupportedNodeTypes) {
		return node.textContent;
	}

	public static setText(node: SupportedNodeTypes, value: string) {
		node.textContent = value;
	}

	public static getParent(node: SupportedNodeTypes) {
		if (node instanceof DocumentFragment) {
			node[documentMeta].parent;
		} else {
			return node.parentElement;
		}
	}

	public static removeChild(node: SupportedNodeTypes, child: SupportedNodeTypes) {
		if (child instanceof DocumentFragment) {
			child[documentMeta].parent = null;
			for (const c of child[documentMeta].children) {
				node.removeChild(c);
			}
		} else {
			node.removeChild(child);
		}
	}

	public static getChildren(node: SupportedNodeTypes) {
		if (node instanceof DocumentFragment) {
			return node[documentMeta].children;
		}
		return node.childNodes;
	}

	public static isConnected(node: SupportedNodeTypes): boolean {
		if (node instanceof DocumentFragment) {
			return node[documentMeta].parent ? DomAPIWrapper.isConnected(node[documentMeta].parent) : false;
		}
		return node.isConnected;
	}

	public static appendChild(node: SupportedNodeTypes, child: SupportedNodeTypes) {
		if (node instanceof DocumentFragment) {
		}
	}
}
