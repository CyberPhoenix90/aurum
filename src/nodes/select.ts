import { Callback, DataDrain } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';
import { DataSource } from '../stream/data_source';

export interface SelectProps extends AurumElementProps {
	onAttach?: Callback<Select>;
	onDetach?: Callback<Select>;
	onCreate?: Callback<Select>;
	onDispose?: Callback<Select>;
	onChange?: DataDrain<Event>;
	initialSelection?: number;
	selectedIndexSource?: DataSource<number>;
}

export class Select extends AurumElement {
	public readonly node: HTMLSelectElement;
	public onChange: DataSource<InputEvent>;
	private selectedIndexSource: DataSource<number>;

	constructor(props: SelectProps) {
		super(props, 'select');
		this.createEventHandlers(['change'], props);

		if (props.selectedIndexSource) {
			this.selectedIndexSource = props.selectedIndexSource;
			props.selectedIndexSource.unique().listenAndRepeat((value) => (this.node.selectedIndex = value), this.cancellationToken);
		} else {
			this.node.selectedIndex = props.initialSelection ?? -1;
		}

		if (props.selectedIndexSource) {
			this.node.addEventListener('change', () => {
				props.selectedIndexSource.update(this.node.selectedIndex);
			});
		}
	}

	protected handleAttach() {
		super.handleAttach();
		if (this.selectedIndexSource) {
			this.node.selectedIndex = this.selectedIndexSource.value;
		}
	}
}
