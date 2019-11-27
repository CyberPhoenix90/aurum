import { AurumElement, AurumElementProps } from './aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, StringSource } from '../utilities/common';

export interface InputProps extends AurumElementProps {
	onAttach?: (node: Input) => void;
	placeholder?: StringSource;
	readonly?: StringSource;
	disabled?: StringSource;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	inputValueSource?: DataSource<string>;
	initialValue?: string;
}

export class Input extends AurumElement {
	public node: HTMLInputElement;

	public onChange: DataSource<InputEvent>;
	public onInput: DataSource<InputEvent>;

	constructor(props: InputProps) {
		super(props, 'input');
		if (props.inputValueSource) {
			this.node.value = props.initialValue ?? props.inputValueSource.value ?? '';
			props.inputValueSource.unique().listen((value) => (this.node.value = value), this.cancellationToken);
		} else {
			this.node.value = props.initialValue ?? '';
		}
		this.bindProps(['placeholder', 'readonly', 'disabled'], props);
		this.createEventHandlers(['input', 'change'], props);

		if (props.inputValueSource) {
			this.onInput.map((p) => this.node.value).pipe(props.inputValueSource);
		}
	}
}
