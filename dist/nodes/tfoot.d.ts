import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface TfootProps extends AurumElementProps {
    onAttach?: Callback<Tfoot>;
    onDetach?: Callback<Tfoot>;
    onCreate?: Callback<Tfoot>;
    onDispose?: Callback<Tfoot>;
}
export declare class Tfoot extends AurumElement {
    constructor(props: TfootProps);
}
//# sourceMappingURL=tfoot.d.ts.map