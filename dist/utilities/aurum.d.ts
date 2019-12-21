import { AurumElement, AurumElementModel } from '../nodes/special/aurum_element';
import { Constructor, MapLike } from './common';
export declare class Aurum {
    static attach(aurumElementModel: AurumElementModel, dom: HTMLElement): void;
    static isAttached(dom: HTMLElement): boolean;
    static detach(domNode: HTMLElement): void;
    static factory(node: string | Constructor<AurumElement> | ((...args: any[]) => AurumElement), args: MapLike<any>, ...innerNodes: AurumElementModel[]): AurumElementModel;
}
//# sourceMappingURL=aurum.d.ts.map