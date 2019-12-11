import { DataSource } from '../stream/data_source';
import { ownerSymbol } from '../utilities/owner_symbol';
export class AurumTextElement {
    constructor(text) {
        this.node = this.create(text);
        if (text instanceof DataSource) {
            this.subscription = text.listen((v) => {
                if (this.node) {
                    this.node.textContent = v;
                }
            });
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
        var _a, _b;
        (_b = (_a = this).subscription) === null || _b === void 0 ? void 0 : _b.call(_a);
        delete this.node[ownerSymbol];
        delete this.node;
    }
}
//# sourceMappingURL=aurum_text.js.map