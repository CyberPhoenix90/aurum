import { AurumElement } from './special/aurum_element';
/**
 * @internal
 */
export class Time extends AurumElement {
    constructor(props, children) {
        super(props, children, 'time');
        if (props !== null) {
            this.bindProps(['datetime'], props);
        }
    }
}
//# sourceMappingURL=time.js.map