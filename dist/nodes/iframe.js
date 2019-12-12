import { AurumElement } from './special/aurum_element';
export class IFrame extends AurumElement {
    constructor(props, children) {
        super(props, children, 'iframe');
        if (props !== null) {
            this.bindProps(['src', 'srcdoc', 'width', 'height', 'allow', 'allowFullscreen', 'allowPaymentRequest'], props);
        }
    }
}
//# sourceMappingURL=iframe.js.map