import { HTMLNodeProps, DomNodeCreator } from '../builtin_compoents/dom_adapter';
import { AttributeValue, DataDrain } from '../utilities/common';
import { GenericDataSource, DataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { DuplexDataSource } from '../stream/duplex_data_source';

export interface InputProps extends HTMLNodeProps<HTMLInputElement> {
	placeholder?: AttributeValue;
	readonly?: AttributeValue;
	disabled?: AttributeValue;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	value?: GenericDataSource<string> | string;
	accept?: AttributeValue;
	alt?: AttributeValue;
	autocomplete?: AttributeValue;
	autofocus?: AttributeValue;
	checked?: GenericDataSource<boolean> | boolean;
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
	if (props.value) {
		if (props.value instanceof DataSource) {
			props.value.listenAndRepeat((v) => {
				input.value = v ?? '';
			}, cleanUp);
			input.addEventListener('input', () => {
				(props.value as DataSource<string>).update(input.value);
			});
		} else if (props.value instanceof DuplexDataSource) {
			props.value.listenAndRepeat((v) => {
				input.value = v ?? '';
			}, cleanUp);
			input.addEventListener('input', () => {
				(props.value as DuplexDataSource<string>).updateUpstream(input.value);
			});
		} else {
			input.value = props.value as string;
		}
	}

	if (props.checked) {
		if (props.checked instanceof DataSource) {
			props.checked.listenAndRepeat((v) => {
				input.checked = v ?? false;
			}, cleanUp);
			input.addEventListener('change', () => {
				(props.checked as DataSource<boolean>).update(input.checked);
			});
		} else if (props.checked instanceof DuplexDataSource) {
			props.checked.listenAndRepeat((v) => {
				input.checked = v ?? false;
			}, cleanUp);
			input.addEventListener('change', () => {
				(props.checked as DuplexDataSource<boolean>).updateUpstream(input.checked);
			});
		} else {
			input.checked = props.checked as boolean;
		}
	}
});
