import { DOMEvent, HTMLNodeProps, DomNodeCreator } from '../rendering/renderers/dom_adapter.js';
import { AttributeValue, DataDrain, ReadOnlyDataSource } from '@aurum/streams';
import { BindableSource } from '@aurum/streams';
import { CancellationToken } from '@aurum/streams';
import { queueRenderUpdate, renderBatchState } from '../rendering/render_batch.js';
import { isDataWriter } from './rendering_helpers.js';

export interface InputProps extends HTMLNodeProps<HTMLInputElement> {
    placeholder?: AttributeValue;
    readonly?: AttributeValue;
    readOnly?: AttributeValue;
    disabled?: AttributeValue;
    onChange?: DataDrain<DOMEvent<InputEvent, HTMLInputElement>>;
    onInput?: DataDrain<DOMEvent<InputEvent, HTMLInputElement>>;
    value?: ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | string | number;
    defaultValue?: string | number;
    accept?: AttributeValue;
    alt?: AttributeValue;
    autocomplete?: AttributeValue;
    autoComplete?: AttributeValue;
    autofocus?: AttributeValue;
    autoFocus?: AttributeValue;
    checked?: ReadOnlyDataSource<boolean> | boolean;
    formAction?: AttributeValue;
    formEnctype?: AttributeValue;
    formMethod?: AttributeValue;
    formNoValidate?: AttributeValue;
    formTarget?: AttributeValue;
    step?: AttributeValue;
    list?: AttributeValue;
    max?: AttributeValue;
    maxLength?: AttributeValue;
    maxlength?: AttributeValue;
    min?: AttributeValue;
    minLength?: AttributeValue;
    minlength?: AttributeValue;
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
    if (props?.defaultValue !== undefined) input.defaultValue = String(props.defaultValue);
    if (props?.value !== undefined) {
        if (typeof props.value !== 'string' && typeof props.value !== 'number') {
            const value = props.value as ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
            const updateValue = (v: string | number): void => {
                if (cleanUp.isCancelled) return;
                input.value = v == null ? '' : String(v);
            };
            value.listenAndRepeat((v) => {
                if (renderBatchState.active) queueRenderUpdate(updateValue, updateValue, v);
                else updateValue(v);
            }, cleanUp);
            if (isDataWriter<string | number>(value)) {
                cleanUp.registerDomEvent(input, 'input', () => {
                    const nextValue = typeof value.value === 'number' ? input.valueAsNumber : input.value;
                    value.write(nextValue);
                });
            }
        } else {
            input.value = String(props.value);
        }
    }

    if (props?.checked !== undefined) {
        if (typeof props.checked !== 'boolean') {
            const checked = props.checked as ReadOnlyDataSource<boolean>;
            const updateChecked = (v: boolean): void => {
                if (cleanUp.isCancelled) return;
                input.checked = v ?? false;
            };
            checked.listenAndRepeat((v) => {
                if (renderBatchState.active) queueRenderUpdate(updateChecked, updateChecked, v);
                else updateChecked(v);
            }, cleanUp);
            if (isDataWriter(checked)) {
                cleanUp.registerDomEvent(input, 'change', () => {
                    checked.write(input.checked);
                });
            }
        } else {
            input.checked = props.checked as boolean;
        }
    }
});
