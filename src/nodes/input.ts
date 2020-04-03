import { AttributeValue, Callback, DataDrain } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { DataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';

export interface InputProps extends AurumElementProps {
	onAttach?: Callback<HTMLInputElement>;
	onDetach?: Callback<HTMLInputElement>;
	onCreate?: Callback<HTMLInputElement>;

	placeholder?: AttributeValue;
	readonly?: AttributeValue;
	disabled?: AttributeValue;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	value?: DataSource<string> | DuplexDataSource<string> | string;
	accept?: AttributeValue;
	alt?: AttributeValue;
	autocomplete?: AttributeValue;
	autofocus?: AttributeValue;
	checked?: DataSource<boolean> | DuplexDataSource<boolean> | boolean;
	defaultChecked?: AttributeValue;
	formAction?: AttributeValue;
	formEnctype?: AttributeValue;
	formMethod?: AttributeValue;
	formNoValidate?: AttributeValue;
	formTarget?: AttributeValue;
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
	'type'
];

/**
 * @internal
 */
export class Input extends AurumElement {
	public node: HTMLInputElement;

	constructor(props: InputProps, children: ChildNode[]) {
		super(props, children, 'input');
		if (props !== null) {
			if (props.value instanceof DataSource || props.value instanceof DuplexDataSource) {
				props.value.unique().listenAndRepeat((value) => (this.node.value = value));
				this.node.addEventListener('input', () => {
					if (props.value instanceof DataSource) {
						props.value.update(this.node.value);
					} else if (props.value instanceof DuplexDataSource) {
						props.value.updateUpstream(this.node.value);
					}
				});
			} else {
				this.node.value = props.value ?? '';
			}

			if (props.checked instanceof DataSource || props.checked instanceof DuplexDataSource) {
				props.checked.unique().listenAndRepeat((value) => (this.node.checked = value));
				this.node.addEventListener('change', () => {
					if (props.checked instanceof DataSource) {
						props.checked.update(this.node.checked);
					} else if (props.checked instanceof DuplexDataSource) {
						props.checked.updateUpstream(this.node.checked);
					}
				});
			} else {
				this.node.checked = props.checked ?? false;
			}
			this.bindProps(inputProps, props);
			this.createEventHandlers(inputEvents, props);
		}
	}
}
