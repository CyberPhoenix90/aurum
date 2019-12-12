import { AurumElement } from './aurum_element';
export class Custom extends AurumElement {
    constructor(props, children) {
        super(props, children, props.tag);
        if (props.attributes) {
            if (props !== null) {
                this.bindProps(Object.keys(props.attributes), props.attributes);
            }
        }
    }
}
//# sourceMappingURL=custom.js.map