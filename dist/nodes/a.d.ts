import { AurumElement, AurumElementProps } from './aurum_element';
export interface AProps extends AurumElementProps {
    onAttach?: (node: A) => void;
    onDettach?: (node: A) => void;
}
export declare class A extends AurumElement {
    constructor(props: AProps);
}
//# sourceMappingURL=a.d.ts.map