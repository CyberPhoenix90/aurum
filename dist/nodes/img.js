import { AurumElement } from './aurum_element';
export class Img extends AurumElement {
    constructor(props) {
        super(props, 'img');
        this.bindProps(['src'], props);
    }
}
//# sourceMappingURL=img.js.map