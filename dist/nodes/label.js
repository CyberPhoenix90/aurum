import { AurumElement } from './aurum_element';
export class Label extends AurumElement {
    constructor(props) {
        super(props, 'label');
        if (props !== null) {
            this.bindProps(['for'], props);
        }
    }
}
//# sourceMappingURL=label.js.map