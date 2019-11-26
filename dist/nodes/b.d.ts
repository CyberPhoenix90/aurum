import { AurumElement, AurumElementProps } from './aurum_element';
export interface BProps extends AurumElementProps {
    onAttach?: (node: B) => void;
    onDettach?: (node: B) => void;
}
export declare class B extends AurumElement {
    constructor(props: BProps);
}
//# sourceMappingURL=b.d.ts.map