import { ContextMenu } from 'aurum-components';
import { ArrayDataSource, Aurum, DataSource } from 'aurumjs';
import { ipcRenderer } from 'electron';
import { Project } from '../../models/project';
import { MessageType } from '../../protocol';
import { currentProject } from '../../session/session';
import { ProjectExplorerNode, ProjectExplorerNodeType } from './model';

export interface ProjectExplorerContextMenuProps {
    node: ProjectExplorerNode;
    onRename(node: ProjectExplorerNode): Promise<string>;
}

export function ProjectExplorerContextMenu(props: ProjectExplorerContextMenuProps) {
    const options = [];

    switch (props.node.type) {
        case ProjectExplorerNodeType.ProjectNode:
            options.push(<div>Refresh</div>);
            break;
        case ProjectExplorerNodeType.AssetFolder:
            options.push(<div>Import assets</div>);
            options.push(<div>Refresh</div>);
            break;
        case ProjectExplorerNodeType.AnimationFolder:
            options.push(<div>New animation</div>);
            break;
        case ProjectExplorerNodeType.SchemaFolder:
            options.push(<div>New Schema</div>);
            break;
        case ProjectExplorerNodeType.TileMapFolder:
            options.push(<div>New Tilemap</div>);
            break;
        case ProjectExplorerNodeType.TileSet:
            options.push(<div>New Tileset</div>);
            break;
        case ProjectExplorerNodeType.CodeFolder:
            options.push(
                <div
                    onClick={() => {
                        newNode(props, 'New File', ProjectExplorerNodeType.Code);
                    }}
                >
                    New File
                </div>
            );
            break;
        case ProjectExplorerNodeType.SceneFolder:
            options.push(
                <div
                    onClick={() => {
                        newNode(props, 'New Scene', ProjectExplorerNodeType.Scene, '{ "entities": [], "code": ""}');
                    }}
                >
                    New Scene
                </div>
            );
            break;
        case ProjectExplorerNodeType.GlobalsFolder:
            options.push(
                <div
                    onClick={() => {
                        newNode(props, 'New Globals', ProjectExplorerNodeType.Globals);
                    }}
                >
                    New Globals
                </div>
            );
            break;
        case ProjectExplorerNodeType.StyleFolder:
            options.push(
                <div
                    onClick={() => {
                        newNode(props, 'New Stylesheet', ProjectExplorerNodeType.Style);
                    }}
                >
                    New Stylesheet
                </div>
            );
            break;
        case ProjectExplorerNodeType.ModelsFolder:
            options.push(<div>New Model</div>);
            break;
        case ProjectExplorerNodeType.EntityTemplateFolder:
            options.push(
                <div
                    onClick={() => {
                        newNode(
                            props,
                            'New Entity template',
                            ProjectExplorerNodeType.EntityTemplate,
                            '{ "entities": [], "code": "import { ObjectSchema, InternalEntities } from \\"aurum-game-editor-api\\";\\nimport { Renderable, AurumComponentAPI } from "aurumjs"\\n\\nexport const schema:ObjectSchema = {}\\n\\nexport function initialize(props:any, internalEntities:InternalEntities, children:Renderable[], api:AurumComponentAPI):void {\\n    \\n}\\n"}'
                        );
                    }}
                >
                    New Template
                </div>
            );
            break;
    }
    const rename = (
        <div
            onClick={() => {
                props.onRename(props.node);
            }}
        >
            Rename
        </div>
    );

    if (!props.node.permissions) {
        options.push(
            <div
                onClick={() => {
                    newFolder();
                }}
            >
                New folder
            </div>
        );
        options.push(rename);
        options.push(<div>Delete</div>);
    } else {
        if (props.node.permissions.newFolder !== false) {
            options.push(
                <div
                    onClick={() => {
                        newFolder();
                    }}
                >
                    New Folder
                </div>
            );
        }
        if (props.node.permissions.rename !== false) {
            options.push(rename);
        }
        if (props.node.permissions.delete !== false) {
            options.push(<div>Delete</div>);
        }
    }

    if (Project.isFolder(props.node.type)) {
        options.push(
            <div
                onClick={async () => {
                    await ipcRenderer.invoke('*', {
                        type: MessageType.OpenFolder,
                        payload: {
                            path: currentProject.value.getPathByNode(props.node)
                        }
                    });
                }}
            >
                Open folder
            </div>
        );
    } else {
        options.push(
            <div
                onClick={async () => {
                    await ipcRenderer.invoke('*', {
                        type: MessageType.OpenFolder,
                        payload: {
                            path: currentProject.value.getPathByNode(props.node)
                        }
                    });
                }}
            >
                Open in default editor
            </div>
        );
    }

    if (options.length === 0) {
        return undefined;
    }

    return <ContextMenu>{options}</ContextMenu>;

    function newFolder() {
        props.node.open.update(true);
        const newNode: ProjectExplorerNode = {
            children: new ArrayDataSource(),
            permissions: {
                rename: true
            },
            name: new DataSource('New folder'),
            open: new DataSource(false),
            type: props.node.type,
            parent: new DataSource(props.node)
        };
        props.node.children.push(newNode);
        setTimeout(async () => {
            const name = await props.onRename(newNode);
            currentProject.value.addFolder(props.node, name);
        });
    }
}
function newNode(props: ProjectExplorerContextMenuProps, defaultName: string, newNodeType: ProjectExplorerNodeType, defaultContent: string = '') {
    props.node.open.update(true);
    const newNode: ProjectExplorerNode = {
        children: new ArrayDataSource(),
        permissions: {
            rename: true
        },
        name: new DataSource(defaultName),
        open: new DataSource(false),
        type: newNodeType,
        parent: new DataSource(props.node)
    };

    props.node.children.push(newNode);
    setTimeout(async () => {
        const name = await props.onRename(newNode);
        currentProject.value.addFile(props.node, name, defaultContent);
    });
}
