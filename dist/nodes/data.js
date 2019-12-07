import { AurumElement } from './aurum_element';
export class Data extends AurumElement {
    constructor(props) {
        super(props, 'data');
        if (props !== null) {
            this.bindProps(['datalue'], props);
        }
    }
}
//# sourceMappingURL=data.js.map