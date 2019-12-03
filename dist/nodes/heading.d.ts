import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface HeadingProps extends AurumElementProps {
    onAttach?: Callback<Heading>;
    onDetach?: Callback<Heading>;
    onCreate?: Callback<Heading>;
    onDispose?: Callback<Heading>;
}
export declare class Heading extends AurumElement {
    readonly node: HTMLHeadingElement;
    constructor(props: HeadingProps);
}
//# sourceMappingURL=heading.d.ts.map