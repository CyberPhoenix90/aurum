import { AurumElement } from './aurum_element';
export class Label extends AurumElement {
    constructor(props, children) {
        super(props, children, 'label');
        if (props !== null) {
            this.bindProps(['for'], props);
        }
    }
}
//# sourceMappingURL=label.js.map