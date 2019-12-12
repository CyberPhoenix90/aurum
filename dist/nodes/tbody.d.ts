import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface TbodyProps extends AurumElementProps {
    onAttach?: Callback<Tbody>;
    onDetach?: Callback<Tbody>;
    onCreate?: Callback<Tbody>;
    onDispose?: Callback<Tbody>;
}
export declare class Tbody extends AurumElement {
    constructor(props: TbodyProps, children: ChildNode[]);
}
//# sourceMappingURL=tbody.d.ts.map