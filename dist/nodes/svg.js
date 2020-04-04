import { AurumElement } from './special/aurum_element';
/**
 * @internal
 */
export class Svg extends AurumElement {
    constructor(props, children) {
        super(props, children, 'svg');
        if (props !== null) {
            this.bindProps(['width', 'height'], props);
        }
    }
}
//# sourceMappingURL=svg.js.map