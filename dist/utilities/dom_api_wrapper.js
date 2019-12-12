const documentMeta = Symbol('DocumentFragmentMeta');
export class DomAPIWrapper {
    static getText(node) {
        return node.textContent;
    }
    static setText(node, value) {
        node.textContent = value;
    }
    static getParent(node) {
        if (node instanceof DocumentFragment) {
            node[documentMeta].parent;
        }
        else {
            return node.parentElement;
        }
    }
    static removeChild(node, child) {
        if (child instanceof DocumentFragment) {
            child[documentMeta].parent = null;
            for (const c of child[documentMeta].children) {
                node.removeChild(c);
            }
        }
        else {
            node.removeChild(child);
        }
    }
    static getChildren(node) {
        if (node instanceof DocumentFragment) {
            return node[documentMeta].children;
        }
        return node.childNodes;
    }
    static isConnected(node) {
        if (node instanceof DocumentFragment) {
            return node[documentMeta].parent ? DomAPIWrapper.isConnected(node[documentMeta].parent) : false;
        }
        return node.isConnected;
    }
    static appendChild(node, child) {
        if (node instanceof DocumentFragment) {
        }
    }
}
//# sourceMappingURL=dom_api_wrapper.js.map