import { AurumElement, AurumElementProps, StringSource } from './aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain } from '../utilities/common';

export interface InputProps extends AurumElementProps {
	onAttach?: (node: Input) => void;
	placeholder?: StringSource;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	inputValueSource?: DataSource<string>;
}

export class Input extends AurumElement {
	public node: HTMLInputElement;

	public onChange: DataSource<InputEvent>;
	public onInput: DataSource<InputEvent>;
	public onFocus: DataSource<FocusEvent>;
	public onBlur: DataSource<FocusEvent>;

	constructor(props: InputProps) {
		super(props, 'input');
		if (props.inputValueSource) {
			props.inputValueSource.listen((value) => (this.node.value = value), this.cancellationToken);
		}
		if (props.placeholder) {
			this.assignStringSourceToAttribute(props.placeholder, 'placeholder');
		}

		this.createEventHandlers(['input', 'change', 'focus', 'blur'], props);
	}
}
