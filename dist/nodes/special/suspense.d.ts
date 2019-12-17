import { DataSource } from '../../stream/data_source';
import { ChildNode } from './aurum_element';
export interface SuspenseProps {
    fallback?: ChildNode;
}
export declare function Suspense(props: SuspenseProps, children: ChildNode[]): DataSource<ChildNode>;
//# sourceMappingURL=suspense.d.ts.map