import { StringSource, Callback } from '../utilities/common';
import { AurumElement, ChildNode, AurumElementProps } from './special/aurum_element';
export interface AProps extends AurumElementProps {
    onAttach?: Callback<A>;
    onDetach?: Callback<A>;
    onCreate?: Callback<A>;
    onDispose?: Callback<A>;
    href?: StringSource;
    target?: StringSource;
}
export declare class A extends AurumElement {
    readonly node: HTMLAnchorElement;
    constructor(props: AProps, children: ChildNode[]);
}
//# sourceMappingURL=a.d.ts.map