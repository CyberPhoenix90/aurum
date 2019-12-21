import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
export interface TemplateProps<T> extends AurumElementProps {
    onAttach?(entity: Template<T>): void;
    onDetach?(entity: Template<T>): void;
    generator(model: T): AurumElement;
    ref?: string | number;
}
export declare class Template<T> extends AurumElement {
    generate: (model: T) => AurumElement;
    ref: string | number;
    constructor(props: TemplateProps<T>, children: ChildNode[]);
}
//# sourceMappingURL=template.d.ts.map