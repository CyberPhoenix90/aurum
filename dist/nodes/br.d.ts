import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface BrProps extends AurumElementProps {
    onAttach?: Callback<Br>;
    onDetach?: Callback<Br>;
    onCreate?: Callback<Br>;
    onDispose?: Callback<Br>;
}
export declare class Br extends AurumElement {
    readonly node: HTMLBRElement;
    constructor(props: BrProps);
}
//# sourceMappingURL=br.d.ts.map