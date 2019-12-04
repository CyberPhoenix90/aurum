import { AurumElement } from './aurum_element';
export class Select extends AurumElement {
    constructor(props) {
        var _a;
        super(props, 'select');
        this.createEventHandlers(['change'], props);
        if (props.selectedIndexSource) {
            props.selectedIndexSource.unique().listenAndRepeat((value) => (this.node.selectedIndex = value), this.cancellationToken);
        }
        else {
            this.node.selectedIndex = (_a = props.initialSelection, (_a !== null && _a !== void 0 ? _a : 0));
        }
        if (props.selectedIndexSource) {
            this.onChange.map((p) => this.node.selectedIndex).pipe(props.selectedIndexSource);
        }
    }
}
//# sourceMappingURL=select.js.map