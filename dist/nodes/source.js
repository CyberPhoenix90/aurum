import { AurumElement } from './special/aurum_element';
/**
 * @internal
 */
export class Source extends AurumElement {
    constructor(props, children) {
        super(props, children, 'source');
        if (props !== null) {
            this.bindProps(['src', 'srcSet', 'media', 'sizes', 'type'], props);
        }
    }
}
//# sourceMappingURL=source.js.map