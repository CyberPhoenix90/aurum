import { AurumElementProps, ChildNode } from './aurum_element';
import { DataSource } from '../../stream/data_source';
export interface SwitchProps<T = boolean> extends AurumElementProps {
    state: DataSource<T>;
}
declare const switchCaseIdentity: unique symbol;
export interface SwitchCaseInstance<T> {
    [switchCaseIdentity]: boolean;
    value: T;
    default: boolean;
    content: ChildNode[];
}
export declare function Switch<T = boolean>(props: SwitchProps<T>, children: any): DataSource<ChildNode[]>;
export interface SwitchCaseProps<T> {
    when: T;
}
export declare function SwitchCase<T>(props: SwitchCaseProps<T>, children: any): SwitchCaseInstance<T>;
export declare function DefaultSwitchCase(props: {}, children: any): SwitchCaseInstance<any>;
export {};
//# sourceMappingURL=switch.d.ts.map