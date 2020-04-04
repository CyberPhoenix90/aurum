import { AurumElement } from './special/aurum_element';
/**
 * @internal
 */
export class Canvas extends AurumElement {
    constructor(props, children) {
        super(props, children, 'canvas');
        if (props !== null) {
            this.bindProps(['width', 'height'], props);
        }
    }
}
//# sourceMappingURL=canvas.js.map