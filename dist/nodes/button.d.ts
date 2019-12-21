import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface ButtonProps extends AurumElementProps {
    disabled?: StringSource;
    onAttach?: Callback<HTMLButtonElement>;
    onDetach?: Callback<HTMLButtonElement>;
    onCreate?: Callback<HTMLButtonElement>;
}
export declare class Button extends AurumElement {
    readonly node: HTMLButtonElement;
    constructor(props: ButtonProps, children: ChildNode[]);
}
//# sourceMappingURL=button.d.ts.map