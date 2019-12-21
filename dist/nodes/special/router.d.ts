import { DataSource } from '../../stream/data_source';
import { ChildNode } from './aurum_element';
declare const routeIdentity: unique symbol;
export interface RouteInstance {
    [routeIdentity]: boolean;
    href: string;
    default: boolean;
    content: ChildNode[];
}
export declare function AurumRouter(props: any, children: any): DataSource<ChildNode[]>;
export interface RouteProps {
    href: string;
}
export declare function Route(props: RouteProps, children: any): RouteInstance;
export declare function DefaultRoute(props: {}, children: any): RouteInstance;
export {};
//# sourceMappingURL=router.d.ts.map