import { AurumElement, AurumElementProps } from './aurum_element';
export interface PProps extends AurumElementProps {
    onAttach?: (node: P) => void;
    onDettach?: (node: P) => void;
}
export declare class P extends AurumElement {
    constructor(props: PProps);
}
//# sourceMappingURL=p.d.ts.map