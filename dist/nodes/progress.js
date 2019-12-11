import { AurumElement } from './aurum_element';
export class Progress extends AurumElement {
    constructor(props, children) {
        super(props, children, 'progress');
        if (props !== null) {
            this.bindProps(['max', 'value'], props);
        }
    }
}
//# sourceMappingURL=progress.js.map