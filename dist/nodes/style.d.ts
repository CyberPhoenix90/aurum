import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback, StringSource } from '../utilities/common';
export interface StyleProps extends AurumElementProps {
    onAttach?: Callback<Style>;
    onDetach?: Callback<Style>;
    onCreate?: Callback<Style>;
    onDispose?: Callback<Style>;
    media?: StringSource;
}
export declare class Style extends AurumElement {
    node: HTMLStyleElement;
    constructor(props: StyleProps);
}
//# sourceMappingURL=style.d.ts.map