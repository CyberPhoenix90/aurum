import { AurumElement, AurumElementProps } from './aurum_element';
export interface LiProps extends AurumElementProps {
    onAttach?: (node: Li) => void;
    onDettach?: (node: Li) => void;
}
export declare class Li extends AurumElement {
    constructor(props: LiProps);
}
//# sourceMappingURL=li.d.ts.map