import { AurumElement } from './aurum_element';
export class Time extends AurumElement {
    constructor(props) {
        super(props, 'time');
        if (props !== null) {
            this.bindProps(['datetime'], props);
        }
    }
}
//# sourceMappingURL=time.js.map