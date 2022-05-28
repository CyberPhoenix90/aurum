import { MapLike } from './common';
import { JsxNode, Renderable } from './rendering';

export class Aurum {
    public static fragment() {}

    public static factory(node: string | ((props: any) => Renderable), args: MapLike<any>, ...innerNodes: Renderable[]): JsxNode<any> {
        //@ts-ignore
        if (node === Aurum.fragment) {
            return {
                name: undefined,
                isIntrinsic: false,
                props: undefined,
                isFragment: true,
                children: innerNodes
            };
        }

        let name;
        let intrinsic = false;
        if (typeof node === 'string') {
            intrinsic = true;
            name = node;
        } else {
            name = node.name;
        }

        if (intrinsic) {
            return {
                name,
                isIntrinsic: true,
                isFragment: false,
                props: args,
                children: innerNodes
            };
        } else {
            return {
                name,
                isFragment: false,
                isIntrinsic: false,
                factory: node as (props: any) => Renderable,
                props: args,
                children: innerNodes
            };
        }
    }
}
