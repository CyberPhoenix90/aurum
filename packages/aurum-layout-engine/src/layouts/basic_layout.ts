import { CancellationToken, dsMap, dsPipe } from 'aurumjs';
import { LayoutData, LayoutElementTreeNode } from '../model';
import { AbstractLayout } from './abstract_layout';

export class BasicLayout extends AbstractLayout {
    public onLink(data: LayoutData, owner: LayoutElementTreeNode, sessionToken: CancellationToken): void {
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
