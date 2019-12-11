import { AurumElement, AurumElementProps, ChildNode } from './aurum_element';
import { Callback } from '../utilities/common';
export interface TableProps extends AurumElementProps {
    onAttach?: Callback<Table>;
    onDetach?: Callback<Table>;
    onCreate?: Callback<Table>;
    onDispose?: Callback<Table>;
}
export declare class Table extends AurumElement {
    node: HTMLTableElement;
    constructor(props: TableProps, children: ChildNode[]);
}
//# sourceMappingURL=table.d.ts.map