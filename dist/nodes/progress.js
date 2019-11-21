import { AurumElement } from './aurum_element';
export class Progress extends AurumElement {
    constructor(props) {
        super(props, 'progress');
        this.bindProps(['max', 'value'], props);
    }
}
//# sourceMappingURL=progress.js.map