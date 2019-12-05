import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface HeadProps extends AurumElementProps {
    onAttach?: Callback<Head>;
    onDetach?: Callback<Head>;
    onCreate?: Callback<Head>;
    onDispose?: Callback<Head>;
}
export declare class Head extends AurumElement {
    constructor(props: HeadProps);
}
//# sourceMappingURL=head.d.ts.map