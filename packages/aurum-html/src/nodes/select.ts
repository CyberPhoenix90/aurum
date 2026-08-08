import { BindableSource } from '@aurum/streams';
import { CancellationToken } from '@aurum/streams';
import { DOMEvent, DomNodeCreator, HTMLNodeProps } from '../rendering/renderers/dom_adapter.js';
import { AttributeValue, DataDrain, ReadOnlyDataSource } from '@aurum/streams';
import { queueRenderUpdate, renderBatchState } from '../rendering/render_batch.js';
import { isDataWriter } from './rendering_helpers.js';

export interface SelectProps extends HTMLNodeProps<HTMLSelectElement> {
    value?: ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | string | number;
    defaultValue?: string | number;
    disabled?: AttributeValue;
    size?: AttributeValue;
    multiple?: AttributeValue;
    required?: AttributeValue;
    selectedIndex?: ReadOnlyDataSource<number> | number;
    onChange?: DataDrain<DOMEvent<Event, HTMLSelectElement>>;
}

/**
 * @internal
 */
const selectEvents = { change: 'onChange' };

/**
 * @internal
 */
export const Select = DomNodeCreator<SelectProps>('select', ['size', 'multiple', 'required'], selectEvents, (node: HTMLElement, props: SelectProps, cleanUp: CancellationToken) => {
    const select = node as HTMLSelectElement;
    if (props?.defaultValue !== undefined) select.value = String(props.defaultValue);

    if (props?.value !== undefined || props?.selectedIndex !== undefined) {
        // In case props.value is a data source we need to reapply the value when the children change because the children may be unstable/be removed and re-added which would falsify the state.
        if (props.value !== undefined && typeof props.value !== 'string' && typeof props.value !== 'number') {
            const value = props.value as ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
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
            const value = props.value as ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
            const updateValue = (v: string | number): void => {
                if (cleanUp.isCancelled) return;
                select.value = String(v);
            };
            value.listenAndRepeat((v) => {
                if (renderBatchState.active) queueRenderUpdate(updateValue, updateValue, v);
                else updateValue(v);
            }, cleanUp);
            if (isDataWriter<string | number>(value)) {
                cleanUp.registerDomEvent(select, 'change', () => {
                    if (typeof value.value === 'number') {
                        value.write(Number(select.value));
                    } else {
                        value.write(select.value);
                    }
                });
            }
        } else {
            select.value = props.value === undefined ? '' : String(props.value);
        }

        if (props?.selectedIndex !== undefined) {
            if (typeof props.selectedIndex !== 'number') {
                const selectedIndex = props.selectedIndex as ReadOnlyDataSource<number>;
                const updateSelectedIndex = (v: number): void => {
                    if (cleanUp.isCancelled) return;
                    select.selectedIndex = v;
                };
                selectedIndex.listenAndRepeat((v) => {
                    if (renderBatchState.active) {
                        queueRenderUpdate(updateSelectedIndex, updateSelectedIndex, v);
                    } else updateSelectedIndex(v);
                }, cleanUp);
                if (isDataWriter(selectedIndex)) {
                    cleanUp.registerDomEvent(select, 'change', () => {
                        selectedIndex.write(select.selectedIndex);
                    });
                }
            } else {
                select.selectedIndex = props.selectedIndex as number;
            }
        }
    }
});
