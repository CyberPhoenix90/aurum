import { AurumElement, AurumElementProps } from './aurum_element';
export interface DivProps extends AurumElementProps {
    onAttach?: (node: Div) => void;
    onDettach?: (node: Div) => void;
}
export declare class Div extends AurumElement {
    constructor(props: DivProps);
}
//# sourceMappingURL=div.d.ts.map