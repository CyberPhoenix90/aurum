import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';
export interface ButtonProps extends AurumElementProps {
    disabled?: AttributeValue;
    onAttach?: Callback<HTMLButtonElement>;
    onDetach?: Callback<HTMLButtonElement>;
    onCreate?: Callback<HTMLButtonElement>;
}
/**
 * @internal
 */
export declare class Button extends AurumElement {
    readonly node: HTMLButtonElement;
    constructor(props: ButtonProps, children: ChildNode[]);
}
//# sourceMappingURL=button.d.ts.map