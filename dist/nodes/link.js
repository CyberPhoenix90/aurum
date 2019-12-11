import { AurumElement } from './aurum_element';
export class Link extends AurumElement {
    constructor(props, children) {
        super(props, children, 'link');
        if (props !== null) {
            this.bindProps(['href', 'rel', 'media', 'as', 'disabled', 'type'], props);
        }
    }
}
//# sourceMappingURL=link.js.map