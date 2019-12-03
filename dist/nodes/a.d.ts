import { AurumElement, AurumElementProps } from './aurum_element';
import { StringSource, Callback } from '../utilities/common';
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
    constructor(props: AProps);
}
//# sourceMappingURL=a.d.ts.map