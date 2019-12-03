import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface SubProps extends AurumElementProps {
    onAttach?: Callback<Sub>;
    onDetach?: Callback<Sub>;
    onCreate?: Callback<Sub>;
    onDispose?: Callback<Sub>;
}
export declare class Sub extends AurumElement {
    constructor(props: SubProps);
}
//# sourceMappingURL=sub.d.ts.map