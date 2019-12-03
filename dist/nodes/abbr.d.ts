import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps } from './aurum_element';
export interface AbbrProps extends AurumElementProps {
    onAttach?: Callback<Abbr>;
    onDetach?: Callback<Abbr>;
    onCreate?: Callback<Abbr>;
    onDispose?: Callback<Abbr>;
}
export declare class Abbr extends AurumElement {
    constructor(props: AbbrProps);
}
//# sourceMappingURL=abbr.d.ts.map