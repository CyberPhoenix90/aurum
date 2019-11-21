import { AurumElement, AurumElementProps } from './aurum_element';
export interface PreProps extends AurumElementProps {
    onAttach?: (node: Pre) => void;
}
export declare class Pre extends AurumElement {
    constructor(props: PreProps);
}
//# sourceMappingURL=pre.d.ts.map