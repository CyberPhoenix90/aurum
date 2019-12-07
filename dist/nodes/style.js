import { AurumElement } from './aurum_element';
export class Style extends AurumElement {
    constructor(props) {
        super(props, 'style');
        if (props !== null) {
            this.bindProps(['media'], props);
        }
    }
}
//# sourceMappingURL=style.js.map