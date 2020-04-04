import { AurumElement } from './special/aurum_element';
import { DataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
/**
 * @internal
 */
const inputEvents = { input: 'onInput', change: 'onChange' };
/**
 * @internal
 */
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
/**
 * @internal
 */
export class Input extends AurumElement {
    constructor(props, children) {
        var _a, _b;
        super(props, children, 'input');
        if (props !== null) {
            if (props.value instanceof DataSource || props.value instanceof DuplexDataSource) {
                props.value.unique().listenAndRepeat((value) => (this.node.value = value));
                this.node.addEventListener('input', () => {
                    if (props.value instanceof DataSource) {
                        props.value.update(this.node.value);
                    }
                    else if (props.value instanceof DuplexDataSource) {
                        props.value.updateUpstream(this.node.value);
                    }
                });
            }
            else {
                this.node.value = (_a = props.value) !== null && _a !== void 0 ? _a : '';
            }
            if (props.checked instanceof DataSource || props.checked instanceof DuplexDataSource) {
                props.checked.unique().listenAndRepeat((value) => (this.node.checked = value));
                this.node.addEventListener('change', () => {
                    if (props.checked instanceof DataSource) {
                        props.checked.update(this.node.checked);
                    }
                    else if (props.checked instanceof DuplexDataSource) {
                        props.checked.updateUpstream(this.node.checked);
                    }
                });
            }
            else {
                this.node.checked = (_b = props.checked) !== null && _b !== void 0 ? _b : false;
            }
            this.bindProps(inputProps, props);
            this.createEventHandlers(inputEvents, props);
        }
    }
}
//# sourceMappingURL=input.js.map