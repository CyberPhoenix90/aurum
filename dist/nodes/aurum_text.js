import { DataSource } from '../stream/data_source';
import { ownerSymbol } from '../utilities/owner_symbol';
export class AurumTextElement {
    constructor(text) {
        this.node = this.create(text);
        if (text instanceof DataSource) {
            text.listen((v) => (this.node.textContent = v));
            this.source = text;
        }
    }
    resolveStringSource(source) {
        if (typeof source === 'string') {
            return source;
        }
        else {
            return source.value;
        }
    }
    create(text) {
        const node = document.createTextNode(this.resolveStringSource(text));
        node[ownerSymbol] = this;
        return node;
    }
    remove() {
        if (this.hasParent()) {
            this.node.parentElement[ownerSymbol].removeChild(this.node);
        }
    }
    hasParent() {
        return !!this.node.parentElement;
    }
    dispose() {
        var _a;
        (_a = this.source) === null || _a === void 0 ? void 0 : _a.cancelAll();
        delete this.node[ownerSymbol];
        delete this.node;
    }
}
//# sourceMappingURL=aurum_text.js.map