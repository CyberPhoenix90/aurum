import { AurumElement } from './special/aurum_element';
export class Style extends AurumElement {
    constructor(props, children) {
        super(props, children, 'style');
        if (props !== null) {
            this.bindProps(['media'], props);
        }
    }
}
//# sourceMappingURL=style.js.map