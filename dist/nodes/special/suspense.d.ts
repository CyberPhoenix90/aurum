import { AurumElement, AurumElementProps, Template, ChildNode } from './aurum_element';
import { MapLike, Provider } from '../../utilities/common';
export interface SuspenseProps<T = boolean> extends AurumElementProps {
    loader: Provider<Promise<AurumElement>>;
}
export declare class Suspense<T = boolean> extends AurumElement {
    templateMap: MapLike<Template<void>>;
    template: Template<void>;
    constructor(props: SuspenseProps<T>, children: ChildNode[]);
}
//# sourceMappingURL=suspense.d.ts.map