import { AurumElement, AurumElementProps } from './aurum_element';
export interface ButtonProps extends AurumElementProps {
    onAttach?: (node: Button) => void;
    onDettach?: (node: Button) => void;
}
export declare class Button extends AurumElement {
    constructor(props: ButtonProps);
}
//# sourceMappingURL=button.d.ts.map