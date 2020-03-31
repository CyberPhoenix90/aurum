import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback, AttributeValue } from '../utilities/common';
export interface DataProps extends AurumElementProps {
    onAttach?: Callback<HTMLDataElement>;
    onDetach?: Callback<HTMLDataElement>;
    onCreate?: Callback<HTMLDataElement>;
    value?: AttributeValue;
}
export declare class Data extends AurumElement {
    node: HTMLDataElement;
    constructor(props: DataProps, children: ChildNode[]);
}
//# sourceMappingURL=data.d.ts.map