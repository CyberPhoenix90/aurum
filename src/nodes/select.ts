import { DataSource } from '../stream/data_source';
import { Callback, DataDrain } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { DuplexDataSource } from '../stream/duplex_data_source';
import { CancellationToken } from '../utilities/cancellation_token';

export interface SelectProps extends AurumElementProps<HTMLSelectElement> {
	onAttach?: Callback<HTMLSelectElement>;
	onDetach?: Callback<HTMLSelectElement>;
	onCreate?: Callback<HTMLSelectElement>;
	onChange?: DataDrain<Event>;
	value?: DataSource<string> | DuplexDataSource<string> | string;
	selectedIndex?: DataSource<number> | DuplexDataSource<number> | number;
}

/**
 * @internal
 */
const selectEvents = { change: 'onChange' };

/**
 * @internal
 */
export class Select extends AurumElement {
	public readonly node: HTMLSelectElement;
	private value: DataSource<string> | DuplexDataSource<string> | string;
	private selectedIndex: DataSource<number> | DuplexDataSource<number> | number;

	constructor(props: SelectProps, children: ChildNode[]) {
		super(props, children, 'select');
		if (props !== null) {
			this.createEventHandlers(selectEvents, props);

			if (props.value) {
				this.value = props.value;
				if (props.value instanceof DataSource || props.value instanceof DuplexDataSource) {
					if (!this.cleanUp) {
						this.cleanUp = new CancellationToken();
					}

					props.value.listen((v) => {
						this.node.value = v;
					}, this.cleanUp);
					this.node.addEventListener('change', () => {
						if (props.value instanceof DataSource) {
							props.value.update(this.node.value);
						} else if (props.value instanceof DuplexDataSource) {
							props.value.updateUpstream(this.node.value);
						}
					});
				}
			}

			if (props.selectedIndex) {
				this.selectedIndex = props.selectedIndex;
				if (props.selectedIndex instanceof DataSource || props.selectedIndex instanceof DuplexDataSource) {
					if (!this.cleanUp) {
						this.cleanUp = new CancellationToken();
					}

					props.selectedIndex.listen((v) => {
						this.node.selectedIndex = v;
					}, this.cleanUp);
					this.node.addEventListener('change', () => {
						if (props.selectedIndex instanceof DataSource) {
							props.selectedIndex.update(this.node.selectedIndex);
						} else if (props.selectedIndex instanceof DuplexDataSource) {
							props.selectedIndex.updateUpstream(this.node.selectedIndex);
						}
					});
				}
			}
		}
	}

	protected handleAttach(parent: AurumElement) {
		super.handleAttach(parent);
		if (this.node.isConnected) {
			if (this.value instanceof DataSource || this.value instanceof DuplexDataSource) {
				this.node.value = this.value.value;
			} else if (this.value !== undefined) {
				this.node.value = this.value;
			} else if (this.selectedIndex instanceof DataSource || this.selectedIndex instanceof DuplexDataSource) {
				this.node.selectedIndex = this.selectedIndex.value;
			} else if (this.selectedIndex !== undefined) {
				this.node.selectedIndex = this.selectedIndex;
			}
		}
	}
}
