import { Switch } from './switch';
import { AurumElementProps, Template } from '../aurum_element';
export interface AurumRouterProps extends AurumElementProps {
}
export declare class AurumRouter extends Switch<string> {
    constructor(props: AurumRouterProps);
    protected selectTemplate(ref: string): Template<void>;
}
//# sourceMappingURL=router.d.ts.map