import { AurumElement } from './aurum_element';
export class Time extends AurumElement {
    constructor(props) {
        super(props, 'time');
        this.bindProps(['datetime'], props);
    }
}
//# sourceMappingURL=time.js.map