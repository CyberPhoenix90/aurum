import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface QProps extends AurumElementProps {
    onAttach?: Callback<Q>;
    onDetach?: Callback<Q>;
    onCreate?: Callback<Q>;
    onDispose?: Callback<Q>;
}
export declare class Q extends AurumElement {
    node: HTMLQuoteElement;
    constructor(props: QProps);
}
//# sourceMappingURL=q.d.ts.map