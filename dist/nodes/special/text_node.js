import { AurumElement } from '../aurum_element';
import { ownerSymbol } from '../../utilities/owner_symbol';
import { DataSource } from '../../stream/data_source';
export class TextNode extends AurumElement {
    constructor(props) {
        super(props, 'textNode');
        if (props.text instanceof DataSource) {
            props.text.listen((v) => (this.node.textContent = v), this.cancellationToken);
        }
    }
    create(props) {
        const node = document.createTextNode(this.resolveStringSource(props.text));
        node[ownerSymbol] = this;
        return node;
    }
}
//# sourceMappingURL=text_node.js.map