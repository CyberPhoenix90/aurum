import { AurumElement } from './special/aurum_element';
const textAreaEvents = { input: 'onInput', change: 'onChange' };
const textAreaProps = [
    'placeholder',
    'readonly',
    'disabled',
    'rows',
    'wrap',
    'autocomplete',
    'autofocus',
    'max',
    'maxLength',
    'min',
    'minLength',
    'required',
    'type'
];
export class TextArea extends AurumElement {
    constructor(props, children) {
        var _a, _b, _c;
        super(props, children, 'textArea');
        if (props !== null) {
            if (props.inputValueSource) {
                this.node.value = (_b = (_a = props.initialValue, (_a !== null && _a !== void 0 ? _a : props.inputValueSource.value)), (_b !== null && _b !== void 0 ? _b : ''));
                props.inputValueSource.unique().listen((value) => (this.node.value = value), this.cancellationToken);
            }
            else {
                this.node.value = (_c = props.initialValue, (_c !== null && _c !== void 0 ? _c : ''));
            }
            this.bindProps(textAreaProps, props);
            this.createEventHandlers(textAreaEvents, props);
            if (props.inputValueSource) {
                this.node.addEventListener('input', () => {
                    props.inputValueSource.update(this.node.value);
                });
            }
        }
    }
}
//# sourceMappingURL=textarea.js.map