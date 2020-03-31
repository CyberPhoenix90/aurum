import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, Callback, AttributeValue } from '../utilities/common';

export interface TextAreaProps extends AurumElementProps {
	onAttach?: Callback<HTMLTextAreaElement>;
	onDetach?: Callback<HTMLTextAreaElement>;
	onCreate?: Callback<HTMLTextAreaElement>;

	placeholder?: AttributeValue;
	readonly?: AttributeValue;
	disabled?: AttributeValue;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	inputValueSource?: DataSource<string>;
	initialValue?: string;

	rows?: AttributeValue;
	wrap?: AttributeValue;
	autocomplete?: AttributeValue;
	autofocus?: AttributeValue;
	max?: AttributeValue;
	maxLength?: AttributeValue;
	min?: AttributeValue;
	minLength?: AttributeValue;
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

/**
 * @internal
 */
export class TextArea extends AurumElement {
	public node: HTMLTextAreaElement;

	constructor(props: TextAreaProps, children: ChildNode[]) {
		super(props, children, 'textArea');
		if (props !== null) {
			if (props.inputValueSource) {
				this.node.value = props.initialValue ?? props.inputValueSource.value ?? '';
				props.inputValueSource.unique().listen((value) => (this.node.value = value));
			} else {
				this.node.value = props.initialValue ?? '';
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
