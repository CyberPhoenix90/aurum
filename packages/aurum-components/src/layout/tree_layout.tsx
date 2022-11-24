import { ArrayDataSource, Aurum, AurumComponentAPI, CancellationToken, DataSource, dsMap, Renderable } from 'aurumjs';
import { PanelDockBottom, PanelDockLeft, PanelDockRight, PanelDockTop } from './panel_dock.js';
import { PanelComponent } from './panel_layout.js';

export interface LayoutTreeNode {
    left?: DataSource<LayoutTreeNode>;
    right?: DataSource<LayoutTreeNode>;
    top?: DataSource<LayoutTreeNode>;
    bottom?: DataSource<LayoutTreeNode>;
    center?: DataSource<LayoutTreeNode>;

    width?: DataSource<number>;
    height?: DataSource<number>;

    userResizable?: DataSource<boolean>;
    content: ArrayDataSource<Renderable>;
}

export interface LayoutTreeLayoutProps {
    root: DataSource<LayoutTreeNode>;
}

export function TreeLayout(props: LayoutTreeLayoutProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    return renderLayoutTreeNode(props.root, api.cancellationToken);
}

function renderLayoutTreeNode(nodeSource: DataSource<LayoutTreeNode>, token: CancellationToken): Renderable {
    return nodeSource.transform(
        dsMap((node) => {
            return (
                <PanelComponent>
                    {node.left ? (
                        <PanelDockLeft resizable={node.userResizable}>
                            <TreeLayout root={node.left}></TreeLayout>
                        </PanelDockLeft>
                    ) : undefined}
                    {node.top ? (
                        <PanelDockTop>
                            <TreeLayout root={node.top}></TreeLayout>
                        </PanelDockTop>
                    ) : undefined}
                    {node.right ? (
                        <PanelDockRight>
                            <TreeLayout root={node.right}></TreeLayout>
                        </PanelDockRight>
                    ) : undefined}
                    {node.bottom ? (
                        <PanelDockBottom>
                            <TreeLayout root={node.bottom}></TreeLayout>
                        </PanelDockBottom>
                    ) : undefined}
                    {node.content}
                </PanelComponent>
            );
        }),
        token
    );
}
