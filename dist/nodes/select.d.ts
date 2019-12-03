import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';
export interface SelectProps extends AurumElementProps {
    onAttach?: Callback<Select>;
    onDetach?: Callback<Select>;
    onCreate?: Callback<Select>;
    onDispose?: Callback<Select>;
}
export declare class Select extends AurumElement {
    readonly node: HTMLSelectElement;
    constructor(props: SelectProps);
}
//# sourceMappingURL=select.d.ts.map