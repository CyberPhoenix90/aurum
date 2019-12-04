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
export declare class Select extends AurumElement {
    readonly node: HTMLSelectElement;
    onChange: DataSource<InputEvent>;
    constructor(props: SelectProps);
}
//# sourceMappingURL=select.d.ts.map