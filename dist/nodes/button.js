import { AurumElement } from './aurum_element';
export class Button extends AurumElement {
    constructor(props) {
        super(props, 'button');
        this.bindProps(['disabled'], props);
    }
}
//# sourceMappingURL=button.js.map