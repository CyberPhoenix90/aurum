import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface AsideProps extends AurumElementProps {
    onAttach?: Callback<Aside>;
    onDetach?: Callback<Aside>;
    onCreate?: Callback<Aside>;
    onDispose?: Callback<Aside>;
}
export declare class Aside extends AurumElement {
    constructor(props: AsideProps, children: ChildNode[]);
}
//# sourceMappingURL=aside.d.ts.map