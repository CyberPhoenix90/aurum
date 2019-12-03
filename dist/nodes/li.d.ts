import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface LiProps extends AurumElementProps {
    onAttach?: Callback<Li>;
    onDetach?: Callback<Li>;
    onCreate?: Callback<Li>;
    onDispose?: Callback<Li>;
}
export declare class Li extends AurumElement {
    node: HTMLLIElement;
    constructor(props: LiProps);
}
//# sourceMappingURL=li.d.ts.map