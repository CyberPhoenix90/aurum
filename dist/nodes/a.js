import { AurumElement } from './aurum_element';
export class A extends AurumElement {
    constructor(props, children) {
        super(props, children, 'a');
        if (props !== null) {
            this.bindProps(['href', 'target'], props);
        }
    }
}
//# sourceMappingURL=a.js.map