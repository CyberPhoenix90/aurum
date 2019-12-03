import { AurumElement } from '../../aurumjs';
export class Custom extends AurumElement {
    constructor(props) {
        super(props, props.tag);
        if (props.attributes) {
            this.bindProps(Object.keys(props.attributes), props.attributes);
        }
    }
}
//# sourceMappingURL=custom.js.map