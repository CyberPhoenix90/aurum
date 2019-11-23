import { AurumElement, AurumElementProps } from './aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, StringSource } from '../utilities/common';

export interface TextAreaProps extends AurumElementProps {
	onAttach?: (node: TextArea) => void;
	placeholder?: StringSource;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	inputValueSource?: DataSource<string>;
	initialValue?: string;
}

export class TextArea extends AurumElement {
	public node: HTMLTextAreaElement;

	public onChange: DataSource<InputEvent>;
	public onInput: DataSource<InputEvent>;

	constructor(props: TextAreaProps) {
		super(props, 'textArea');
		if (props.inputValueSource) {
			this.node.value = props.initialValue ?? props.inputValueSource.value ?? '';
			props.inputValueSource.listen((value) => (this.node.value = value), this.cancellationToken);
		} else {
			this.node.value = props.initialValue ?? '';
		}
		this.bindProps(['placeholder'], props);
		this.createEventHandlers(['input', 'change'], props);
	}
}