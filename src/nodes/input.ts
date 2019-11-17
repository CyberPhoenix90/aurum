import { AurumElement, AurumElementProps, StringSource } from './aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain } from '../utilities/common';

export interface InputProps extends AurumElementProps {
	onAttach?: (node: Input) => void;
	placeholder?: StringSource;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	onKeyDown?: DataDrain<KeyboardEvent>;
	inputValueSource?: DataSource<string>;
}

export class Input extends AurumElement {
	public node: HTMLInputElement;

	public onKeyDown: DataSource<KeyboardEvent>;
	public onChange: DataSource<InputEvent>;
	public onInput: DataSource<InputEvent>;
	public onFocus: DataSource<FocusEvent>;
	public onBlur: DataSource<FocusEvent>;

	constructor(props: InputProps) {
		super(props);
		if (props.inputValueSource) {
			props.inputValueSource.listen((value) => (this.node.value = value), this.cancellationToken);
		}
		if (props.placeholder) {
			this.handleStringSource(props.placeholder, 'placeholder');
		}
	}

	public create(props: InputProps): HTMLElement {
		const input = document.createElement('input');
		this.onKeyDown = new DataSource();
		this.onInput = new DataSource();
		this.onChange = new DataSource();
		this.onFocus = new DataSource();
		this.onBlur = new DataSource();

		if (props.onChange) {
			if (props.onChange instanceof DataSource) {
				this.onChange.listen(props.onChange.update.bind(props.onChange), this.cancellationToken);
			} else {
				this.onChange.listen(props.onChange, this.cancellationToken);
			}
		}

		if (props.onKeyDown) {
			if (props.onKeyDown instanceof DataSource) {
				this.onKeyDown.listen(props.onKeyDown.update.bind(props.onKeyDown), this.cancellationToken);
			} else {
				this.onKeyDown.listen(props.onKeyDown, this.cancellationToken);
			}
		}

		if (props.onInput) {
			if (props.onInput instanceof DataSource) {
				this.onInput.listen(props.onInput.update.bind(props.onInput), this.cancellationToken);
			} else {
				this.onInput.listen(props.onInput, this.cancellationToken);
			}
		}

		this.cancellationToken.registerDomEvent(input, 'keydown', (e: KeyboardEvent) => this.onKeyDown.update(e));
		this.cancellationToken.registerDomEvent(input, 'input', (e: InputEvent) => this.onInput.update(e));
		this.cancellationToken.registerDomEvent(input, 'change', (e: InputEvent) => this.onChange.update(e));
		this.cancellationToken.registerDomEvent(input, 'focus', (e: FocusEvent) => this.onFocus.update(e));
		this.cancellationToken.registerDomEvent(input, 'blur', (e: FocusEvent) => this.onBlur.update(e));

		return input;
	}
}
