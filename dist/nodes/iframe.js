import { AurumElement } from './aurum_element';
export class IFrame extends AurumElement {
    constructor(props) {
        super(props, 'iframe');
        if (props !== null) {
            this.bindProps(['src', 'srcdoc', 'width', 'height', 'allow', 'allowFullscreen', 'allowPaymentRequest'], props);
        }
    }
}
//# sourceMappingURL=iframe.js.map