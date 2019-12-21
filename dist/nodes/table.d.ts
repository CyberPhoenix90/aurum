import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { Callback } from '../utilities/common';
export interface TableProps extends AurumElementProps {
    onAttach?: Callback<HTMLTableElement>;
    onDetach?: Callback<HTMLTableElement>;
    onCreate?: Callback<HTMLTableElement>;
}
export declare class Table extends AurumElement {
    node: HTMLTableElement;
    constructor(props: TableProps, children: ChildNode[]);
}
//# sourceMappingURL=table.d.ts.map