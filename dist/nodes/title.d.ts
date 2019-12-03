import { AurumElement, AurumElementProps } from './aurum_element';
import { Callback } from '../utilities/common';
export interface TitleProps extends AurumElementProps {
    onAttach?: Callback<Title>;
    onDetach?: Callback<Title>;
    onCreate?: Callback<Title>;
    onDispose?: Callback<Title>;
}
export declare class Title extends AurumElement {
    node: HTMLTitleElement;
    constructor(props: TitleProps);
}
//# sourceMappingURL=title.d.ts.map