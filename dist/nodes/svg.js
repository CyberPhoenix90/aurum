import { AurumElement } from './aurum_element';
export class Svg extends AurumElement {
    constructor(props) {
        super(props, 'svg');
        if (props !== null) {
            this.bindProps(['width', 'height'], props);
        }
    }
}
//# sourceMappingURL=svg.js.map