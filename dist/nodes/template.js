import { AurumElement } from './special/aurum_element';
export class Template extends AurumElement {
    constructor(props, children) {
        super(props, children, 'template');
        this.ref = props.ref;
        this.generate = props.generator;
    }
}
//# sourceMappingURL=template.js.map