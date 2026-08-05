import { BindableSource } from '@aurum/streams';
import { AttributeValue, DataDrain } from '@aurum/streams';
import { CancellationToken } from '@aurum/streams';
import { HTMLNodeProps, DomNodeCreator } from '../rendering/renderers/dom_adapter.js';

export interface TextAreaProps extends HTMLNodeProps<HTMLTextAreaElement> {
    placeholder?: AttributeValue;
    readonly?: AttributeValue;
    disabled?: AttributeValue;
    onChange?: DataDrain<InputEvent>;
    onInput?: DataDrain<InputEvent>;
    value?: BindableSource<string> | string;
    cols?: AttributeValue;
    rows?: AttributeValue;
    wrap?: AttributeValue;
    form?: AttributeValue;
    autocomplete?: AttributeValue;
    autofocus?: AttributeValue;
    max?: AttributeValue;
    maxLength?: AttributeValue;
    min?: AttributeValue;
    minLength?: AttributeValue;
    spellcheck?: AttributeValue;
    required?: AttributeValue;
    type?: AttributeValue;
}

/**
 * @internal
 */
const textAreaEvents = { input: 'onInput', change: 'onChange' };

/**
 * @internal
 */
const textAreaProps = [
    'placeholder',
    'readonly',
    'disabled',
    'form',
    'cols',
    'rows',
    'wrap',
    'autocomplete',
    'autofocus',
    'max',
    'maxLength',
    'min',
    'spellcheck',
    'minLength',
    'required',
    'type'
];

/**
 * @internal
 */
export const TextArea = DomNodeCreator<TextAreaProps>(
    'textArea',
    textAreaProps,
    textAreaEvents,
    (node: HTMLElement, props: TextAreaProps, cleanUp: CancellationToken) => {
        const textArea = node as HTMLTextAreaElement;
        if (props?.value !== undefined) {
            if (typeof props.value !== 'string') {
                const value = props.value as BindableSource<string>;
                value.listenAndRepeat((v) => {
                    textArea.value = v;
                }, cleanUp);
                textArea.addEventListener('input', () => {
                    value.write(textArea.value);
                });
            } else {
                textArea.value = props.value as string;
            }
        }
    }
);
