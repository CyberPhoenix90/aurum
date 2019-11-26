import { AurumElement, AurumElementProps, Template } from '../aurum_element';
import { MapLike } from '../../utilities/common';
import { DataSource } from '../../stream/data_source';
export interface SwitchProps<T = boolean> extends AurumElementProps {
    state: DataSource<T>;
    templateMap?: MapLike<Template<void>>;
    templaet?: Template<void>;
}
export declare class Switch<T = boolean> extends AurumElement {
    private lastValue;
    private firstRender;
    templateMap: MapLike<Template<void>>;
    template: Template<void>;
    constructor(props: SwitchProps<T>);
    protected renderSwitch(data: T): void;
}
//# sourceMappingURL=switch.d.ts.map