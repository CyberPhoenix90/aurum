import { AurumElement } from './aurum_element';
export class IFrame extends AurumElement {
    constructor(props) {
        super(props, 'iframe');
        this.bindProps(['src'], props);
    }
}
//# sourceMappingURL=iframe.js.map