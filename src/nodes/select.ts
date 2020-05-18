import { DataSource, GenericDataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { DomNodeCreator, HTMLNodeProps } from './dom_adapter';

export interface SelectProps extends HTMLNodeProps<HTMLSelectElement> {
	value?: GenericDataSource<string> | string;
	selectedIndex?: GenericDataSource<number> | number;
}

/**
 * @internal
 */
const selectEvents = { change: 'onChange' };

/**
 * @internal
 */
export const Select = DomNodeCreator<SelectProps>('select', undefined, selectEvents, (node: HTMLElement, props: SelectProps, cleanUp: CancellationToken) => {
	const select = node as HTMLSelectElement;
	if (props.value) {
		if (props.value instanceof DataSource) {
			props.value.listenAndRepeat((v) => {
				select.value = v;
			}, cleanUp);
			select.addEventListener('change', () => {
				(props.value as DataSource<string>).update(select.value);
			});
		} else if (props.value instanceof DuplexDataSource) {
			props.value.listenAndRepeat((v) => {
				select.value = v;
			}, cleanUp);
			select.addEventListener('change', () => {
				(props.value as DuplexDataSource<string>).updateUpstream(select.value);
			});
		} else {
			select.value = props.value as string;
		}
	}

	if (props.selectedIndex) {
		if (props.selectedIndex instanceof DataSource) {
			props.selectedIndex.listenAndRepeat((v) => {
				select.selectedIndex = v;
			}, cleanUp);
			select.addEventListener('change', () => {
				(props.selectedIndex as DataSource<number>).update(select.selectedIndex);
			});
		} else if (props.selectedIndex instanceof DuplexDataSource) {
			props.selectedIndex.listenAndRepeat((v) => {
				select.selectedIndex = v;
			}, cleanUp);
			select.addEventListener('change', () => {
				(props.selectedIndex as DuplexDataSource<number>).updateUpstream(select.selectedIndex);
			});
		} else {
			select.selectedIndex = props.selectedIndex as number;
		}
	}
});
