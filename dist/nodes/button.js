import { AurumElement } from './aurum_element';
export class Button extends AurumElement {
    constructor(props, children) {
        super(props, children, 'button');
        if (props !== null) {
            this.bindProps(['disabled'], props);
        }
    }
}
//# sourceMappingURL=button.js.map