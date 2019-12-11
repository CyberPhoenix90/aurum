import { AurumElement } from './aurum_element';
export class Svg extends AurumElement {
    constructor(props, children) {
        super(props, children, 'svg');
        if (props !== null) {
            this.bindProps(['width', 'height'], props);
        }
    }
}
//# sourceMappingURL=svg.js.map