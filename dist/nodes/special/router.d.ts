import { Switch } from './switch';
import { AurumElementProps, Template, ChildNode } from './aurum_element';
export interface AurumRouterProps extends AurumElementProps {
}
export declare class AurumRouter extends Switch<string> {
    constructor(props: AurumRouterProps, children: ChildNode[]);
    protected selectTemplate(ref: string): Template<void>;
}
//# sourceMappingURL=router.d.ts.map