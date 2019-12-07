import { DataSource } from '../stream/data_source';
import { Callback, DataDrain } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';

export interface SelectProps extends AurumElementProps {
	onAttach?: Callback<Select>;
	onDetach?: Callback<Select>;
	onCreate?: Callback<Select>;
	onDispose?: Callback<Select>;
	onChange?: DataDrain<Event>;
	initialSelection?: number;
	selectedIndexSource?: DataSource<number>;
}

const selectEvents = { change: 'onChange' };
export class Select extends AurumElement {
	public readonly node: HTMLSelectElement;
	private selectedIndexSource: DataSource<number>;
	private initialSelection: number;

	constructor(props: SelectProps) {
		super(props, 'select');
		if (props !== null) {
			this.createEventHandlers(selectEvents, props);
			this.initialSelection = props.initialSelection;

			if (props.selectedIndexSource) {
				this.selectedIndexSource = props.selectedIndexSource;
				props.selectedIndexSource.unique().listenAndRepeat((value) => (this.node.selectedIndex = value), this.cancellationToken);
			} else {
				this.node.selectedIndex = props.initialSelection ?? -1;
			}

			if (props.selectedIndexSource) {
				this.needAttach = true;
				this.node.addEventListener('change', () => {
					props.selectedIndexSource.update(this.node.selectedIndex);
				});
			}
		}
	}

	protected handleAttach(parent: AurumElement) {
		super.handleAttach(parent);
		if (this.node.isConnected) {
			if (this.selectedIndexSource) {
				this.node.selectedIndex = this.selectedIndexSource.value;
			} else if (this.initialSelection !== undefined) {
				this.node.selectedIndex = this.initialSelection;
			}
		}
	}
}
