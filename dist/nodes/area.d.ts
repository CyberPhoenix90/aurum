import { Callback } from '../utilities/common';
import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
export interface AreaProps extends AurumElementProps {
    onAttach?: Callback<Area>;
    onDetach?: Callback<Area>;
    onCreate?: Callback<Area>;
    onDispose?: Callback<Area>;
}
export declare class Area extends AurumElement {
    readonly node: HTMLAreaElement;
    constructor(props: AreaProps, children: ChildNode[]);
}
//# sourceMappingURL=area.d.ts.map