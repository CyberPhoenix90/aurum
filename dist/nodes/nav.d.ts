import { AurumElement, AurumElementProps } from './aurum_element';
export interface NavProps extends AurumElementProps {
    onAttach?: (node: Nav) => void;
    onDettach?: (node: Nav) => void;
}
export declare class Nav extends AurumElement {
    constructor(props: NavProps);
}
//# sourceMappingURL=nav.d.ts.map