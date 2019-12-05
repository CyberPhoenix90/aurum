import { AurumElement, AurumElementProps } from './aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, StringSource, Callback } from '../utilities/common';

export interface InputProps extends AurumElementProps {
	onAttach?: Callback<Input>;
	onDetach?: Callback<Input>;
	onCreate?: Callback<Input>;
	onDispose?: Callback<Input>;

	placeholder?: StringSource;
	readonly?: StringSource;
	disabled?: StringSource;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	inputValueSource?: DataSource<string>;
	initialValue?: string;
	accept?: StringSource;
	alt?: StringSource;
	autocomplete?: StringSource;
	autofocus?: StringSource;
	checked?: StringSource;
	defaultChecked?: StringSource;
	formAction?: StringSource;
	formEnctype?: StringSource;
	formMethod?: StringSource;
	formNoValidate?: StringSource;
	formTarget?: StringSource;
	max?: StringSource;
	maxLength?: StringSource;
	min?: StringSource;
	minLength?: StringSource;
	pattern?: StringSource;
	multiple?: StringSource;
	required?: StringSource;
	type?: StringSource;
}

export class Input extends AurumElement {
	public node: HTMLInputElement;

	public onChange: DataSource<InputEvent>;
	public onInput: DataSource<InputEvent>;

	constructor(props: InputProps) {
		super(props, 'input');
		if (props.inputValueSource) {
			props.inputValueSource.unique().listenAndRepeat((value) => (this.node.value = value), this.cancellationToken);
		} else {
			this.node.value = props.initialValue ?? '';
		}
		this.bindProps(
			[
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
			],
			props
		);
		this.createEventHandlers(['input', 'change'], props);

		if (props.inputValueSource) {
			this.node.addEventListener('input', () => {
				props.inputValueSource.update(this.node.value);
			});
		}
	}
}
