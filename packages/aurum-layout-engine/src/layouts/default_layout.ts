import { CancellationToken, DataSource, dsTap, dsUnique } from 'aurumjs';
import { LayoutEngine } from '../layout_engine';
import { LayoutData, LayoutElementTreeNode, REFOWDIRECTION } from '../model';
import { AbstractLayout } from './abstract_layout';

export class DefaultLayout extends AbstractLayout {
    public onLink(layout: LayoutData, owner: LayoutElementTreeNode, sessionToken: CancellationToken): void {
        // this.watchProperty(owner.x, owner, layoutEngine, { positionChanged: true }, sessionToken);
        // this.watchProperty(owner.y, owner, layoutEngine, { positionChanged: true }, sessionToken);
        // this.watchProperty(owner.width, owner, layoutEngine, { innerSizeChanged: true, outerSizeChanged: true }, sessionToken);
        // this.watchProperty(owner.height, owner, layoutEngine, { innerSizeChanged: true, outerSizeChanged: true }, sessionToken);
        // this.watchProperty(owner.marginBottom, owner, layoutEngine, { outerSizeChanged: true }, sessionToken);
        // this.watchProperty(owner.marginLeft, owner, layoutEngine, { outerSizeChanged: true }, sessionToken);
        // this.watchProperty(owner.marginRight, owner, layoutEngine, { outerSizeChanged: true }, sessionToken);
        // this.watchProperty(owner.marginTop, owner, layoutEngine, { outerSizeChanged: true }, sessionToken);
        // const width = owner.width.transform(dsMap((s) => (typeof s === 'number' ? s : 0)));
        // const height = owner.height.transform(dsMap((s) => (typeof s === 'number' ? s : 0)));
        // return {
        //     x: owner.x.transform(
        //         dsMap((s) => (typeof s === 'number' ? s : 0)),
        //         sessionToken
        //     ),
        //     y: owner.y.transform(
        //         dsMap((s) => (typeof s === 'number' ? s : 0)),
        //         sessionToken
        //     ),
        //     innerWidth: width,
        //     innerHeight: height,
        //     outerWidth: width,
        //     outerHeight: height
        // };
    }

    //@ts-ignore
    private watchProperty(
        property: DataSource<any>,
        owner: LayoutElementTreeNode,
        layoutEngine: LayoutEngine,
        change: {
            positionChanged?: boolean;
            innerSizeChanged?: boolean;
            outerSizeChanged?: boolean;
        },
        sessionToken: CancellationToken
    ) {
        property.transform(
            dsUnique(),
            dsTap(() => {
                layoutEngine.emitChange({
                    source: owner,
                    changeFlowDirection: REFOWDIRECTION.BIDIRECTIONAL,
                    innerSizeChanged: false,
                    outerSizeChanged: false,
                    positionChanged: false,
                    ...change
                });
            }),
            sessionToken
        );
    }
}
