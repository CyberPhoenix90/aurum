import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface DataProps extends AurumElementProps {
    onAttach?: Callback<Data>;
    onDetach?: Callback<Data>;
    onCreate?: Callback<Data>;
    onDispose?: Callback<Data>;
    value?: StringSource;
}
export declare class Data extends AurumElement {
    node: HTMLDataElement;
    constructor(props: DataProps, children: ChildNode[]);
}
//# sourceMappingURL=data.d.ts.map