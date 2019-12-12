import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface FormProps extends AurumElementProps {
    onAttach?: Callback<Form>;
    onDetach?: Callback<Form>;
    onCreate?: Callback<Form>;
    onDispose?: Callback<Form>;
}
export declare class Form extends AurumElement {
    readonly node: HTMLFormElement;
    constructor(props: FormProps, children: ChildNode[]);
}
//# sourceMappingURL=form.d.ts.map