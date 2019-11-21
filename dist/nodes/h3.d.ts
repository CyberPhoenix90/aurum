import { AurumElement, AurumElementProps } from './aurum_element';
export interface H3Props extends AurumElementProps {
    onAttach?: (node: H3) => void;
    onDettach?: (node: H3) => void;
}
export declare class H3 extends AurumElement {
    constructor(props: H3Props);
}
//# sourceMappingURL=h3.d.ts.map