import { HTMLNodeProps, DomNodeCreator } from '../rendering/renderers/dom_adapter.js';
import { AttributeValue, DataDrain } from '../utilities/common.js';
import { BindableSource } from '../stream/data_source.js';
import { CancellationToken } from '../utilities/cancellation_token.js';

export interface InputProps extends HTMLNodeProps<HTMLInputElement> {
    placeholder?: AttributeValue;
    readonly?: AttributeValue;
    disabled?: AttributeValue;
    onChange?: DataDrain<InputEvent>;
    onInput?: DataDrain<InputEvent>;
    value?: BindableSource<string> | string;
    accept?: AttributeValue;
    alt?: AttributeValue;
    autocomplete?: AttributeValue;
    autofocus?: AttributeValue;
    checked?: BindableSource<boolean> | boolean;
    formAction?: AttributeValue;
    formEnctype?: AttributeValue;
    formMethod?: AttributeValue;
    formNoValidate?: AttributeValue;
    formTarget?: AttributeValue;
    step?: AttributeValue;
    list?: AttributeValue;
    max?: AttributeValue;
    maxLength?: AttributeValue;
    min?: AttributeValue;
    minLength?: AttributeValue;
    pattern?: AttributeValue;
    multiple?: AttributeValue;
    required?: AttributeValue;
    type?: AttributeValue;
}

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
    'type',
    'step',
    'list'
];

/**
 * @internal
 */
export const Input = DomNodeCreator<InputProps>('input', inputProps, inputEvents, (node: HTMLElement, props: InputProps, cleanUp: CancellationToken) => {
    const input = node as HTMLInputElement;
    if (props?.value !== undefined) {
        if (typeof props.value !== 'string') {
            const value = props.value as BindableSource<string>;
            value.listenAndRepeat((v) => {
                input.value = v ?? '';
            }, cleanUp);
            input.addEventListener('input', () => {
                value.write(input.value);
            });
        } else {
            input.value = props.value as string;
        }
    }

    if (props?.checked !== undefined) {
        if (typeof props.checked !== 'boolean') {
            const checked = props.checked as BindableSource<boolean>;
            checked.listenAndRepeat((v) => {
                input.checked = v ?? false;
            }, cleanUp);
            input.addEventListener('change', () => {
                checked.write(input.checked);
            });
        } else {
            input.checked = props.checked as boolean;
        }
    }
});
