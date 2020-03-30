import { AurumElement } from './special/aurum_element';
const inputEvents = { input: 'onInput', change: 'onChange' };
const inputProps = [
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
];
export class Input extends AurumElement {
    constructor(props, children) {
        var _a;
        super(props, children, 'input');
        if (props !== null) {
            if (props.inputValueSource) {
                props.inputValueSource.unique().listenAndRepeat((value) => (this.node.value = value));
            }
            else {
                this.node.value = (_a = props.initialValue, (_a !== null && _a !== void 0 ? _a : ''));
            }
            this.bindProps(inputProps, props);
            this.createEventHandlers(inputEvents, props);
            if (props.inputValueSource) {
                this.node.addEventListener('input', () => {
                    props.inputValueSource.update(this.node.value);
                });
            }
        }
    }
}
//# sourceMappingURL=input.js.map