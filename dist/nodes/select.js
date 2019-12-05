import { AurumElement } from './aurum_element';
export class Select extends AurumElement {
    constructor(props) {
        var _a;
        super(props, 'select');
        this.createEventHandlers(['change'], props);
        if (props.selectedIndexSource) {
            this.selectedIndexSource = props.selectedIndexSource;
            props.selectedIndexSource.unique().listenAndRepeat((value) => (this.node.selectedIndex = value), this.cancellationToken);
        }
        else {
            this.node.selectedIndex = (_a = props.initialSelection, (_a !== null && _a !== void 0 ? _a : -1));
        }
        if (props.selectedIndexSource) {
            this.node.addEventListener('change', () => {
                props.selectedIndexSource.update(this.node.selectedIndex);
            });
        }
    }
    handleAttach() {
        super.handleAttach();
        if (this.selectedIndexSource) {
            this.node.selectedIndex = this.selectedIndexSource.value;
        }
    }
}
//# sourceMappingURL=select.js.map