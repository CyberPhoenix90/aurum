import { DataSource } from '../../stream/data_source';
import { ownerSymbol } from '../../utilities/owner_symbol';
export class AurumTextElement {
    constructor(text) {
        this.node = this.create(text);
        if (text instanceof DataSource) {
            text.listen((v) => {
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
}
//# sourceMappingURL=aurum_text.js.map