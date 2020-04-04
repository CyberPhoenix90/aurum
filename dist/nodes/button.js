import { AurumElement } from './special/aurum_element';
/**
 * @internal
 */
export class Button extends AurumElement {
    constructor(props, children) {
        super(props, children, 'button');
        if (props !== null) {
            this.bindProps(['disabled'], props);
        }
    }
}
//# sourceMappingURL=button.js.map