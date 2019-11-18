import { AurumElement } from '../nodes/aurum_element';
import { Constructor, MapLike } from './common';
export declare class Aurum {
    static attach(node: AurumElement, dom: HTMLElement): void;
    static detach(domNode: HTMLElement): void;
    static factory(node: Constructor<AurumElement> | ((...args: any[]) => AurumElement), args: MapLike<any>, ...innerNodes: AurumElement[]): AurumElement;
}
//# sourceMappingURL=aurum.d.ts.map