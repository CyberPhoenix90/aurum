import { AurumElement, AurumElementProps } from './aurum_element';
export interface H5Props extends AurumElementProps {
    onAttach?: (node: H5) => void;
    onDettach?: (node: H5) => void;
}
export declare class H5 extends AurumElement {
    constructor(props: H5Props);
}
//# sourceMappingURL=h5.d.ts.map