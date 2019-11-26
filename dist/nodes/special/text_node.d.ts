import { AurumElement, AurumElementProps } from '../aurum_element';
import { StringSource } from '../../utilities/common';
export interface TextNodeProps extends AurumElementProps {
    onAttach?: (node: TextNode) => void;
    onDettach?: (node: TextNode) => void;
    text?: StringSource;
}
export declare class TextNode extends AurumElement {
    constructor(props: TextNodeProps);
    protected create(props: TextNodeProps): HTMLElement | Text;
}
//# sourceMappingURL=text_node.d.ts.map