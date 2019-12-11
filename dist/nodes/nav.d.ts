import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';
export interface NavProps extends AurumElementProps {
    onAttach?: Callback<Nav>;
    onDetach?: Callback<Nav>;
    onCreate?: Callback<Nav>;
    onDispose?: Callback<Nav>;
}
export declare class Nav extends AurumElement {
    constructor(props: NavProps, children: ChildNode[]);
}
//# sourceMappingURL=nav.d.ts.map