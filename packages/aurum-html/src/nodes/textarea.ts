import { BindableSource } from '@aurum/streams';
import { AttributeValue, DataDrain, ReadOnlyDataSource } from '@aurum/streams';
import { CancellationToken } from '@aurum/streams';
import { DOMEvent, HTMLNodeProps, DomNodeCreator } from '../rendering/renderers/dom_adapter.js';
import { queueRenderUpdate, renderBatchState } from '../rendering/render_batch.js';
import { isDataWriter } from './rendering_helpers.js';

export interface TextAreaProps extends HTMLNodeProps<HTMLTextAreaElement> {
    placeholder?: AttributeValue;
    readonly?: AttributeValue;
    readOnly?: AttributeValue;
    disabled?: AttributeValue;
    onChange?: DataDrain<DOMEvent<InputEvent, HTMLTextAreaElement>>;
    onInput?: DataDrain<DOMEvent<InputEvent, HTMLTextAreaElement>>;
    value?: ReadOnlyDataSource<string> | string;
    defaultValue?: string;
    cols?: AttributeValue;
    rows?: AttributeValue;
    wrap?: AttributeValue;
    form?: AttributeValue;
    autocomplete?: AttributeValue;
    autoComplete?: AttributeValue;
    autofocus?: AttributeValue;
    autoFocus?: AttributeValue;
    max?: AttributeValue;
    maxLength?: AttributeValue;
    maxlength?: AttributeValue;
    min?: AttributeValue;
    minLength?: AttributeValue;
    minlength?: AttributeValue;
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
        if (props?.defaultValue !== undefined) textArea.defaultValue = props.defaultValue;
        if (props?.value !== undefined) {
            if (typeof props.value !== 'string') {
                const value = props.value as ReadOnlyDataSource<string>;
                const updateValue = (v: string): void => {
                    if (cleanUp.isCancelled) return;
                    textArea.value = v;
                };
                value.listenAndRepeat((v) => {
                    if (renderBatchState.active) queueRenderUpdate(updateValue, updateValue, v);
                    else updateValue(v);
                }, cleanUp);
                if (isDataWriter(value)) {
                    cleanUp.registerDomEvent(textArea, 'input', () => {
                        value.write(textArea.value);
                    });
                }
            } else {
                textArea.value = props.value as string;
            }
        }
    }
);
