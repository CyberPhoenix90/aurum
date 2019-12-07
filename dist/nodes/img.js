import { AurumElement } from './aurum_element';
export class Img extends AurumElement {
    constructor(props) {
        super(props, 'img');
        if (props !== null) {
            this.bindProps(['src', 'alt', 'width', 'height', 'referrerPolicy', 'sizes', 'srcset', 'useMap'], props);
        }
    }
}
//# sourceMappingURL=img.js.map