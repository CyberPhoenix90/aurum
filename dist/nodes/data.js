import { AurumElement } from './special/aurum_element';
/**
 * @internal
 */
export class Data extends AurumElement {
    constructor(props, children) {
        super(props, children, 'data');
        if (props !== null) {
            this.bindProps(['datalue'], props);
        }
    }
}
//# sourceMappingURL=data.js.map