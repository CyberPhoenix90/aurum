import { CancellationToken, dsMap, dsPipe } from 'aurumjs';
import { LayoutData, LayoutElementTreeNode } from '../model';
import { AbstractLayout } from './abstract_layout';

/**
 * The basic layout only supports numerical positions and sizes and just forwards them as is without any modifications. This allows for zero reflow layouting which is very performance efficient at the cost of having no real features
 * Perfect for all nodes that don't need automatic layouting
 */
export class BasicLayout extends AbstractLayout {
    public onLink(
        data: LayoutData,
        owner: LayoutElementTreeNode,
        layoutDataByNode: WeakMap<LayoutElementTreeNode, LayoutData>,
        sessionToken: CancellationToken
    ): void {
        owner.width.transform(
            dsMap((s) => (typeof s === 'number' ? s : 0)),
            dsPipe(data.innerWidth),
            dsPipe(data.outerWidth),
            sessionToken
        );
        owner.height.transform(
            dsMap((s) => (typeof s === 'number' ? s : 0)),
            dsPipe(data.innerHeight),
            dsPipe(data.outerHeight),
            sessionToken
        );

        owner.x.transform(
            dsMap((s) => (typeof s === 'number' ? s : 0)),
            dsPipe(data.x),
            sessionToken
        );
        owner.y.transform(
            dsMap((s) => (typeof s === 'number' ? s : 0)),
            dsPipe(data.y),
            sessionToken
        );
    }
}
