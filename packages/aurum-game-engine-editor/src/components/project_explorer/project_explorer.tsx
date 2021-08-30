import { css } from '@emotion/css';
import { aurumify, currentTheme, Dialog, TreeEntry, TreeViewComponent, TreeViewSorting } from 'aurum-components';
import { Aurum, AurumComponentAPI, DataSource, dsMap, getValueOf, ReadOnlyArrayDataSource, Renderable } from 'aurumjs';
import { Project } from '../../models/project';
import { openFile } from '../../session/session';
import { dialogs } from '../dialogs/dialogs';
import { ProjectExplorerNode } from './model';
import { ProjectExplorerContextMenu } from './project_explorer_context_menu';

export interface ProjectExplorerProps {
    project: DataSource<Project>;
}

const noProjectStyle = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.heading3FontSize, theme.baseFontColor, theme.themeColor1],
        (fontFamily, size, fontColor, color1) => css`
            background-color: ${color1};
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};
            height: 100%;
            user-select: none;

            display: flex;
            justify-content: center;
            align-items: center;
        `,
        lifecycleToken
    )
);

export function ProjectExplorer(props: ProjectExplorerProps, children: Renderable[], api: AurumComponentAPI) {
    return props.project.withInitial(undefined).transform(
        dsMap((project) => {
            if (!project) {
                return <div class={noProjectStyle}>No project open</div>;
            }

            const entries: ReadOnlyArrayDataSource<TreeEntry<ProjectExplorerNode>> = project.content.map<TreeEntry<ProjectExplorerNode>>((e) =>
                projectExplorerNodeToTreeEntry(e)
            );

            const renameTarget = new DataSource(undefined);

            return (
                <TreeViewComponent
                    renaming={renameTarget}
                    allowFocus
                    onEntryClicked={(e, item) => {
                        if (!Project.isFolder(item.tag.type)) {
                            const file = project.getFileOrFolderByNode(item.tag);
                            openFile(file);
                        }
                    }}
                    onEntryRightClicked={(e, item) => {
                        e.preventDefault();
                        spawnContextMenu(item, renameTarget, e);
                    }}
                    onKeyDown={(e, n) => {
                        if (n && e.key === 'F2' && (!n.tag.permissions || n.tag.permissions.rename !== false)) {
                            renameTarget.update(n);
                        }
                    }}
                    indentWidth={10}
                    sorting={TreeViewSorting.DIRECTORY_FIRST_THEN_ALPHABETIC}
                    arrowColor=""
                    entries={entries}
                ></TreeViewComponent>
            );
        })
    );
}

function projectExplorerNodeToTreeEntry(e: ProjectExplorerNode): TreeEntry<ProjectExplorerNode> {
    return {
        name: e.name,
        children: e.children.map(projectExplorerNodeToTreeEntry),
        open: e.open,
        tag: e
    };
}

function spawnContextMenu(node: TreeEntry<ProjectExplorerNode>, renameTarget: DataSource<TreeEntry<ProjectExplorerNode>>, e: MouseEvent) {
    dialogs.clear();
    dialogs.push(
        <Dialog
            onClickOutside={() => {
                dialogs.clear();
            }}
            onClickInside={() => {
                dialogs.clear();
            }}
            onEscape={() => {
                dialogs.clear();
            }}
            blockContextMenu
            target={e.target as HTMLElement}
            layout={{
                offset: { x: e.offsetX, y: e.offsetY },
                direction: 'up',
                targetPoint: 'start',
                orientationX: 'left'
            }}
        >
            <ProjectExplorerContextMenu
                onRename={(target) => {
                    return new Promise<string>((resolve) => {
                        renameTarget.update(target);
                        renameTarget.listenOnce(() => {
                            resolve(getValueOf(target.name));
                        });
                    });
                }}
                node={node.tag}
            ></ProjectExplorerContextMenu>
        </Dialog>
    );
}
