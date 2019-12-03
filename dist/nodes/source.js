import { AurumElement } from './aurum_element';
export class Source extends AurumElement {
    constructor(props) {
        super(props, 'source');
        this.bindProps(['src', 'srcSet', 'media', 'sizes', 'type'], props);
    }
}
//# sourceMappingURL=source.js.map