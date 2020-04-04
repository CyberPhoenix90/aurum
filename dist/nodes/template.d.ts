import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface TemplateProps extends AurumElementProps {
    onAttach?: Callback<HTMLTemplateElement>;
    onDetach?: Callback<HTMLTemplateElement>;
    onCreate?: Callback<HTMLTemplateElement>;
}
/**
 * @internal
 */
export declare class Template extends AurumElement {
    constructor(props: TemplateProps, children: ChildNode[]);
}
//# sourceMappingURL=template.d.ts.map