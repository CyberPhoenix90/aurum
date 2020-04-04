import { DataSource } from '../stream/data_source';
import { Callback, DataDrain } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface SelectProps extends AurumElementProps {
    onAttach?: Callback<HTMLSelectElement>;
    onDetach?: Callback<HTMLSelectElement>;
    onCreate?: Callback<HTMLSelectElement>;
    onChange?: DataDrain<Event>;
    initialSelection?: number;
    selectedIndexSource?: DataSource<number>;
}
/**
 * @internal
 */
export declare class Select extends AurumElement {
    readonly node: HTMLSelectElement;
    private selectedIndexSource;
    private initialSelection;
    constructor(props: SelectProps, children: ChildNode[]);
    protected handleAttach(parent: AurumElement): void;
}
//# sourceMappingURL=select.d.ts.map