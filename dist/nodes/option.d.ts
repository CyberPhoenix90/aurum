import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface OptionProps extends AurumElementProps {
    onAttach?: Callback<Option>;
    onDetach?: Callback<Option>;
    onCreate?: Callback<Option>;
    onDispose?: Callback<Option>;
}
export declare class Option extends AurumElement {
    readonly node: HTMLOptionElement;
    constructor(props: OptionProps, children: ChildNode[]);
}
//# sourceMappingURL=option.d.ts.map