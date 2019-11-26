import { AurumElement } from './aurum_element';
export class Script extends AurumElement {
    constructor(props) {
        super(props, 'script');
        this.bindProps(['src'], props);
    }
}
//# sourceMappingURL=script.js.map