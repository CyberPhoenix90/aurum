import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { StringSource, Callback } from '../utilities/common';
export interface DataProps extends AurumElementProps {
    onAttach?: Callback<HTMLDataElement>;
    onDetach?: Callback<HTMLDataElement>;
    onCreate?: Callback<HTMLDataElement>;
    value?: StringSource;
}
export declare class Data extends AurumElement {
    node: HTMLDataElement;
    constructor(props: DataProps, children: ChildNode[]);
}
//# sourceMappingURL=data.d.ts.map