import { BindableSource } from '@aurum/streams';
import { CancellationToken } from '@aurum/streams';
import { DomNodeCreator, HTMLNodeProps } from '../rendering/renderers/dom_adapter.js';
import { AttributeValue, DataDrain } from '@aurum/streams';

export interface SelectProps extends HTMLNodeProps<HTMLSelectElement> {
    value?: BindableSource<string> | string;
    disabled?: AttributeValue;
    selectedIndex?: BindableSource<number> | number;
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
        if (props.value !== undefined && typeof props.value !== 'string') {
            const value = props.value as BindableSource<string>;
            const mo = new MutationObserver(() => {
                select.value = value.value;
            });
            mo.observe(select, {
                childList: true
            });

            cleanUp.addCancellable(() => {
                mo.disconnect();
            });
        }

        if (props?.selectedIndex !== undefined && typeof props.selectedIndex !== 'number') {
            const selectedIndex = props.selectedIndex as BindableSource<number>;
            const mo = new MutationObserver(() => {
                select.selectedIndex = selectedIndex.value;
            });
            mo.observe(select, {
                childList: true
            });

            cleanUp.addCancellable(() => {
                mo.disconnect();
            });
        }

        if (props?.value !== undefined && typeof props.value !== 'string') {
            const value = props.value as BindableSource<string>;
            value.listenAndRepeat((v) => {
                select.value = v;
            }, cleanUp);
            select.addEventListener('change', () => {
                value.write(select.value);
            });
        } else {
            select.value = props.value as string;
        }

        if (props?.selectedIndex) {
            if (typeof props.selectedIndex !== 'number') {
                const selectedIndex = props.selectedIndex as BindableSource<number>;
                selectedIndex.listenAndRepeat((v) => {
                    select.selectedIndex = v;
                }, cleanUp);
                select.addEventListener('change', () => {
                    selectedIndex.write(select.selectedIndex);
                });
            } else {
                select.selectedIndex = props.selectedIndex as number;
            }
        }
    }
});
