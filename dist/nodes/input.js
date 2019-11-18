import { AurumElement } from './aurum_element';
export class Input extends AurumElement {
    constructor(props) {
        super(props, 'input');
        if (props.inputValueSource) {
            props.inputValueSource.listen((value) => (this.node.value = value), this.cancellationToken);
        }
        this.bindProps(['placeholder'], props);
        this.createEventHandlers(['input', 'change', 'focus', 'blur'], props);
    }
}
//# sourceMappingURL=input.js.map