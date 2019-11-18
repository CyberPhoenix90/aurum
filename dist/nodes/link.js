import { AurumElement } from './aurum_element';
export class Link extends AurumElement {
    constructor(props) {
        super(props, 'link');
        this.bindProps(['href', 'rel'], props);
    }
}
//# sourceMappingURL=link.js.map