import { CancellationToken, dsMap, dsPipe } from 'aurumjs';
import { LayoutData, LayoutElementTreeNode } from '../model';
import { AbstractLayout } from './abstract_layout';

/**
 * The basic layout only supports numerical positions and sizes and just forwards them as is without any modifications. This allows for zero reflow layouting which is very performance efficient at the cost of having no real features
 * Perfect for all nodes that don't need automatic layouting
 */
export class BasicLayout extends AbstractLayout {
    public onLink(
        node: LayoutElementTreeNode,
        data: LayoutData,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>,
        sessionToken: CancellationToken
    ): void {
        node.width.transform(
            dsMap((s) => (typeof s === 'number' ? s : 0)),
            dsPipe(data.innerWidth),
            dsPipe(data.outerWidth),
            sessionToken
        );
        node.height.transform(
            dsMap((s) => (typeof s === 'number' ? s : 0)),
            dsPipe(data.innerHeight),
            dsPipe(data.outerHeight),
            sessionToken
        );

        node.x.transform(
            dsMap((s) => (typeof s === 'number' ? s : 0)),
            dsPipe(data.x),
            sessionToken
        );
        node.y.transform(
            dsMap((s) => (typeof s === 'number' ? s : 0)),
            dsPipe(data.y),
            sessionToken
        );
    }
}
