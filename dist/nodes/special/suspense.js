import { AurumElement } from '../aurum_element';
export class Suspense extends AurumElement {
    constructor(props, children) {
        super(props, children, 'suspense');
        props.loader().then((newElement) => {
            this.clearChildren();
            this.addChild(newElement);
        });
    }
}
//# sourceMappingURL=suspense.js.map