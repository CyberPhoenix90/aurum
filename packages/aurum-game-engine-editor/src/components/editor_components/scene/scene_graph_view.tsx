import { ContextMenu, currentTheme, Dialog, TreeEntry, TreeViewComponent } from 'aurum-components';
import { ArrayDataSource, Aurum, DataSource, Renderable } from 'aurumjs';
import { dialogs } from '../../dialogs/dialogs';
import { SceneEntityDataReactive } from './scene_edit_model';

export interface SceneGraphViewProps {
    editTarget: DataSource<SceneEntityDataReactive>;
    rootNodes: {
        name: string;
        data: ArrayDataSource<SceneEntityDataReactive>;
    }[];
}

export function SceneGraphView(props: SceneGraphViewProps): Renderable {
    const { editTarget, rootNodes } = props;
    const rootEntries: TreeEntry<SceneEntityDataReactive>[] = rootNodes.map((e) => ({
        name: e.name,
        children: toTreeViewEntries(e.data),
        open: new DataSource(true)
    }));

    return (
        <TreeViewComponent
            allowDragAndDrop
            canDrag={(e) => !rootEntries.includes(e)}
            canDrop={(e, t) =>
                rootEntries.includes(t) ||
                ((['@internal/panel', '@internal/container'].includes(t.tag?.namespace) || t.tag?.namespace.startsWith('@internal/') === false) &&
                    !isAncestorOf(e.tag, t.tag))
            }
            onEntryDrop={(draggedEntry: TreeEntry<SceneEntityDataReactive>, targetEntry: TreeEntry<SceneEntityDataReactive>) => {
                if (draggedEntry.tag.parent?.value) {
                    draggedEntry.tag.parent.value.children.remove(draggedEntry.tag);
                } else {
                    const owner = rootNodes.find((root) => root.data.includes(draggedEntry.tag));
                    if (!owner) {
                        throw new Error('Illegal state');
                    }
                    owner.data.remove(draggedEntry.tag);
                }
                if (rootEntries.includes(targetEntry)) {
                    rootNodes.find((root) => root.name === targetEntry.name).data.push(draggedEntry.tag);
                    draggedEntry.tag.parent.update(undefined);
                } else {
                    targetEntry.tag.children.push(draggedEntry.tag);
                    draggedEntry.tag.parent.update(targetEntry.tag);
                }
            }}
            onEntrySelected={(entry) => {
                editTarget.update(entry.tag);
            }}
            onEntryRightClicked={(e, entry) => {
                if (entry.tag) {
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
                            target={e.target as HTMLElement}
                            layout={{
                                offset: { x: e.offsetX, y: e.offsetY },
                                direction: 'up',
                                targetPoint: 'start',
                                orientationX: 'left'
                            }}
                        >
                            <ContextMenu>
                                <div>Duplicate</div>
                                <div
                                    onClick={() => {
                                        if (editTarget.value === entry.tag) {
                                            editTarget.update(undefined);
                                        }
                                        if (entry.tag.parent.value) {
                                            entry.tag.parent.value.children.remove(entry.tag);
                                        } else {
                                            const owner = rootNodes.find((root) => root.data.includes(entry.tag));
                                            if (!owner) {
                                                throw new Error('Illegal state');
                                            }
                                            owner.data.remove(entry.tag);
                                        }
                                    }}
                                >
                                    Delete
                                </div>
                            </ContextMenu>
                        </Dialog>
                    );
                }
            }}
            style={`height:calc(50% - 1px); border-top:1px solid ${currentTheme.value.themeColor2.value};`}
            entries={new ArrayDataSource(rootEntries)}
            allowFocus
        ></TreeViewComponent>
    );
}

function isAncestorOf(potentialAncestor: SceneEntityDataReactive, node: SceneEntityDataReactive): boolean {
    let ptr = node.parent?.value;
    while (ptr) {
        if (ptr === potentialAncestor) {
            return true;
        } else {
            ptr = ptr.parent?.value;
        }
    }
}

function toTreeViewEntries(entities: ArrayDataSource<SceneEntityDataReactive>): ArrayDataSource<TreeEntry<SceneEntityDataReactive>> {
    return entities.map((e) => ({
        name: e.name,
        open: new DataSource(false),
        children: toTreeViewEntries(e.children),
        tag: e
    }));
}
