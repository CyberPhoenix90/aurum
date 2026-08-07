import { BindableSource } from '@aurum/streams';
import { CancellationToken } from '@aurum/streams';
import { DomNodeCreator, HTMLNodeProps } from '../rendering/renderers/dom_adapter.js';
import { AttributeValue, DataDrain } from '@aurum/streams';
import { queueRenderUpdate, renderBatchState } from '../rendering/render_batch.js';

export interface SelectProps extends HTMLNodeProps<HTMLSelectElement> {
    value?: BindableSource<string> | BindableSource<number> | string | number;
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

    if (props?.value !== undefined || props?.selectedIndex !== undefined) {
        // In case props.value is a data source we need to reapply the value when the children change because the children may be unstable/be removed and re-added which would falsify the state.
        if (props.value !== undefined && typeof props.value !== 'string' && typeof props.value !== 'number') {
            const value = props.value as BindableSource<string> | BindableSource<number>;
            const mo = new MutationObserver(() => {
                select.value = String(value.value);
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

        if (props?.value !== undefined && typeof props.value !== 'string' && typeof props.value !== 'number') {
            const value = props.value as BindableSource<string> | BindableSource<number>;
            const updateValue = (v: string | number): void => {
                select.value = String(v);
            };
            value.listenAndRepeat((v) => {
                if (renderBatchState.active) queueRenderUpdate(updateValue, () => !cleanUp.isCancelled && updateValue(v));
                else updateValue(v);
            }, cleanUp);
            cleanUp.registerDomEvent(select, 'change', () => {
                if (typeof value.value === 'number') {
                    (value as BindableSource<number>).write(Number(select.value));
                } else {
                    (value as BindableSource<string>).write(select.value);
                }
            });
        } else {
            select.value = props.value === undefined ? '' : String(props.value);
        }

        if (props?.selectedIndex !== undefined) {
            if (typeof props.selectedIndex !== 'number') {
                const selectedIndex = props.selectedIndex as BindableSource<number>;
                const updateSelectedIndex = (v: number): void => {
                    select.selectedIndex = v;
                };
                selectedIndex.listenAndRepeat((v) => {
                    if (renderBatchState.active) {
                        queueRenderUpdate(updateSelectedIndex, () => !cleanUp.isCancelled && updateSelectedIndex(v));
                    } else updateSelectedIndex(v);
                }, cleanUp);
                cleanUp.registerDomEvent(select, 'change', () => {
                    selectedIndex.write(select.selectedIndex);
                });
            } else {
                select.selectedIndex = props.selectedIndex as number;
            }
        }
    }
});
