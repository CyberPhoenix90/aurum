import { DataSource } from '../stream/data_source';
import { Callback, DataDrain } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface SelectProps extends AurumElementProps {
    onAttach?: Callback<Select>;
    onDetach?: Callback<Select>;
    onCreate?: Callback<Select>;
    onDispose?: Callback<Select>;
    onChange?: DataDrain<Event>;
    initialSelection?: number;
    selectedIndexSource?: DataSource<number>;
}
export declare class Select extends AurumElement {
    readonly node: HTMLSelectElement;
    private selectedIndexSource;
    private initialSelection;
    constructor(props: SelectProps, children: ChildNode[]);
    protected handleAttach(parent: AurumElement): void;
}
//# sourceMappingURL=select.d.ts.map