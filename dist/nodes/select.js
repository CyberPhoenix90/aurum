import { AurumElement } from './aurum_element';
export class Select extends AurumElement {
    constructor(props) {
        super(props, 'select');
        this.createEventHandlers(['change'], props);
        this.initialSelection = props.initialSelection;
        if (props.selectedIndexSource) {
            this.selectedIndexSource = props.selectedIndexSource;
            props.selectedIndexSource.unique().listenAndRepeat((value) => (this.node.selectedIndex = value), this.cancellationToken);
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
        else if (this.initialSelection !== undefined) {
            this.node.selectedIndex = this.initialSelection;
        }
    }
}
//# sourceMappingURL=select.js.map