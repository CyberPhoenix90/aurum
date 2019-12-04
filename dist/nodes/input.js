import { AurumElement } from './aurum_element';
export class Input extends AurumElement {
    constructor(props) {
        var _a;
        super(props, 'input');
        if (props.inputValueSource) {
            props.inputValueSource.unique().listenAndRepeat((value) => (this.node.value = value), this.cancellationToken);
        }
        else {
            this.node.value = (_a = props.initialValue, (_a !== null && _a !== void 0 ? _a : ''));
        }
        this.bindProps([
            'placeholder',
            'readonly',
            'disabled',
            'accept',
            'alt',
            'autocomplete',
            'autofocus',
            'checked',
            'defaultChecked',
            'formAction',
            'formEnctype',
            'formMethod',
            'formNoValidate',
            'formTarget',
            'max',
            'maxLength',
            'min',
            'minLength',
            'pattern',
            'multiple',
            'required',
            'type'
        ], props);
        this.createEventHandlers(['input', 'change'], props);
        if (props.inputValueSource) {
            this.onInput.map((p) => this.node.value).pipe(props.inputValueSource);
        }
    }
}
//# sourceMappingURL=input.js.map