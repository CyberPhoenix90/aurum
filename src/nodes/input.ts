import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, Callback, AttributeValue } from '../utilities/common';

export interface InputProps extends AurumElementProps {
	onAttach?: Callback<HTMLInputElement>;
	onDetach?: Callback<HTMLInputElement>;
	onCreate?: Callback<HTMLInputElement>;

	placeholder?: AttributeValue;
	readonly?: AttributeValue;
	disabled?: AttributeValue;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	inputValueSource?: DataSource<string>;
	initialValue?: string;
	accept?: AttributeValue;
	alt?: AttributeValue;
	autocomplete?: AttributeValue;
	autofocus?: AttributeValue;
	checked?: AttributeValue;
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
			if (props.inputValueSource) {
				props.inputValueSource.unique().listenAndRepeat((value) => (this.node.value = value));
			} else {
				this.node.value = props.initialValue ?? '';
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
