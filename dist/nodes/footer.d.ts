import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';
export interface FooterProps extends AurumElementProps {
    onAttach?: Callback<Footer>;
    onDetach?: Callback<Footer>;
    onCreate?: Callback<Footer>;
    onDispose?: Callback<Footer>;
}
export declare class Footer extends AurumElement {
    constructor(props: FooterProps, children: ChildNode[]);
}
//# sourceMappingURL=footer.d.ts.map