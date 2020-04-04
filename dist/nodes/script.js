import { AurumElement } from './special/aurum_element';
/**
 * @internal
 */
export class Script extends AurumElement {
    constructor(props, children) {
        super(props, children, 'script');
        if (props !== null) {
            this.bindProps(['src', 'async', 'defer', 'integrity', 'noModule', 'type'], props);
        }
    }
}
//# sourceMappingURL=script.js.map