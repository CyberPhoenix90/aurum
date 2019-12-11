import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, StringSource, Callback } from '../utilities/common';

export interface TextAreaProps extends AurumElementProps {
	onAttach?: Callback<TextArea>;
	onDetach?: Callback<TextArea>;
	onCreate?: Callback<TextArea>;
	onDispose?: Callback<TextArea>;

	placeholder?: StringSource;
	readonly?: StringSource;
	disabled?: StringSource;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	inputValueSource?: DataSource<string>;
	initialValue?: string;

	rows?: StringSource;
	wrap?: StringSource;
	autocomplete?: StringSource;
	autofocus?: StringSource;
	max?: StringSource;
	maxLength?: StringSource;
	min?: StringSource;
	minLength?: StringSource;
	required?: StringSource;
	type?: StringSource;
}

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
	public node: HTMLTextAreaElement;

	constructor(props: TextAreaProps, children: ChildNode[]) {
		super(props, children, 'textArea');
		if (props !== null) {
			if (props.inputValueSource) {
				this.node.value = props.initialValue ?? props.inputValueSource.value ?? '';
				props.inputValueSource.unique().listen((value) => (this.node.value = value), this.cancellationToken);
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
