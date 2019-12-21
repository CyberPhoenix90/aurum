import { Callback, MapLike, StringSource } from '../../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
export interface CustomProps<T extends HTMLElement> extends AurumElementProps {
    onAttach?: Callback<T>;
    onDetach?: Callback<T>;
    onCreate?: Callback<T>;
    attributes?: MapLike<StringSource>;
    tag: string;
}
export declare class Custom<T extends HTMLElement> extends AurumElement {
    readonly node: T;
    constructor(props: CustomProps<T>, children: ChildNode[]);
}
//# sourceMappingURL=custom.d.ts.map