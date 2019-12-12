import { AurumElement } from '../nodes/special/aurum_element';
import { Constructor, MapLike } from './common';
export declare class Aurum {
    static attach(aurumElement: AurumElement, dom: HTMLElement): void;
    static isAttached(dom: HTMLElement): boolean;
    static detach(domNode: HTMLElement): void;
    static factory(node: string | Constructor<AurumElement> | ((...args: any[]) => AurumElement), args: MapLike<any>, ...innerNodes: AurumElement[]): AurumElement;
}
//# sourceMappingURL=aurum.d.ts.map