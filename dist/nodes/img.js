import { AurumElement } from './special/aurum_element';
export class Img extends AurumElement {
    constructor(props, children) {
        super(props, children, 'img');
        if (props !== null) {
            this.bindProps(['src', 'alt', 'width', 'height', 'referrerPolicy', 'sizes', 'srcset', 'useMap'], props);
        }
    }
}
//# sourceMappingURL=img.js.map