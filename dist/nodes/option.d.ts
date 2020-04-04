import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface OptionProps extends AurumElementProps {
    onAttach?: Callback<HTMLOptionElement>;
    onDetach?: Callback<HTMLOptionElement>;
    onCreate?: Callback<HTMLOptionElement>;
}
/**
 * @internal
 */
export declare class Option extends AurumElement {
    readonly node: HTMLOptionElement;
    constructor(props: OptionProps, children: ChildNode[]);
}
//# sourceMappingURL=option.d.ts.map