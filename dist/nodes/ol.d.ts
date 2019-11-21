import { AurumElement, AurumElementProps } from './aurum_element';
export interface OlProps extends AurumElementProps {
    onAttach?: (node: Ol) => void;
    onDettach?: (node: Ol) => void;
}
export declare class Ol extends AurumElement {
    constructor(props: OlProps);
}
//# sourceMappingURL=ol.d.ts.map