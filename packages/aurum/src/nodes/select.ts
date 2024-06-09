import { DataSource, GenericDataSource } from '../stream/data_source.js';
import { DuplexDataSource } from '../stream/duplex_data_source.js';
import { CancellationToken } from '../utilities/cancellation_token.js';
import { DomNodeCreator, HTMLNodeProps } from '../rendering/renderers/dom_adapter.js';
import { DataDrain } from '../utilities/common.js';

export interface SelectProps extends HTMLNodeProps<HTMLSelectElement> {
    value?: GenericDataSource<string> | string;
    selectedIndex?: GenericDataSource<number> | number;
    onChange?: DataDrain<Event>;
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

    if (props?.value || props?.selectedIndex) {
        // In case props.value is a data source we need to reapply the value when the children change because the children may be unstable/be removed and re-added which would falsify the state.
        if (props.value instanceof DataSource || props.value instanceof DuplexDataSource) {
            const mo = new MutationObserver(() => {
                select.value = (props.value as GenericDataSource<string>).value;
            });
            mo.observe(select, {
                childList: true
            });

            cleanUp.addCancellable(() => {
                mo.disconnect();
            });
        }

        if (props?.selectedIndex instanceof DataSource || props?.selectedIndex instanceof DuplexDataSource) {
            const mo = new MutationObserver(() => {
                select.selectedIndex = (props.selectedIndex as GenericDataSource<number>).value;
            });
            mo.observe(select, {
                childList: true
            });

            cleanUp.addCancellable(() => {
                mo.disconnect();
            });
        }

        if (props?.value instanceof DataSource) {
            props.value.listenAndRepeat((v) => {
                select.value = v;
            }, cleanUp);
            select.addEventListener('change', () => {
                (props.value as DataSource<string>).update(select.value);
            });
        } else if (props?.value instanceof DuplexDataSource) {
            props.value.listenAndRepeat((v) => {
                select.value = v;
            }, cleanUp);
            select.addEventListener('change', () => {
                (props.value as DuplexDataSource<string>).updateUpstream(select.value);
            });
        } else {
            select.value = props.value as string;
        }

        if (props?.selectedIndex) {
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
    }
});
