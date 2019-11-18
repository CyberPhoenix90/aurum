import { AurumElement } from './aurum_element';
export class Canvas extends AurumElement {
    constructor(props) {
        super(props, 'canvas');
        this.bindProps(['width', 'height'], props);
    }
}
//# sourceMappingURL=canvas.js.map