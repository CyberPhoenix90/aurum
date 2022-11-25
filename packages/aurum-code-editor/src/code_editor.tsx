import { PanelComponent, PanelContent, PanelDockBottom, PanelDockLeft, PanelDockRight, PanelDockTop } from 'aurum-components';
import {
    ArrayDataSource,
    AttributeValue,
    Aurum,
    AurumComponentAPI,
    ClassType,
    combineAttribute,
    DataSource,
    dsMap,
    EventEmitter,
    Renderable,
    TreeDataSource
} from 'aurumjs';
import { CodeEditor } from './code_editor_component.js';
import { ConsoleComponent } from './console_component.js';
import { FileTreeNode, FileTreeFile } from './model.js';
import { TabsComponent } from './tabs_component.js';

export interface GeneralProps {
    theme?: DataSource<string>;
    width: DataSource<number> | number;
    height: DataSource<number> | number;

    style?: AttributeValue;
    class?: ClassType;
    openFile?: DataSource<string>;
    files: ArrayDataSource<{ path: string; content: ArrayDataSource<string> | DataSource<Uint8Array> }>;
}

export interface FileExplorerProps {
    fileTree: TreeDataSource<FileTreeNode, 'children'>;
    readonly?: DataSource<boolean>;
    canRename?: DataSource<boolean>;
    canDelete?: DataSource<boolean>;
    canMove?: DataSource<boolean>;
    canCopy?: DataSource<boolean>;
    canDownload?: DataSource<boolean>;
    canUpload?: DataSource<boolean>;
    canCreateFolder?: DataSource<boolean>;
    canCreateFile?: DataSource<boolean>;

    onOpen?: EventEmitter<void>;
    onClose?: EventEmitter<void>;
}

export interface ConsoleProps {
    readonly?: DataSource<boolean>;
    stdOut?: EventEmitter<string>;
    stdIn?: EventEmitter<string>;

    onFocus?: (cancel: () => void) => void;
    onBlur?: (cancel: () => void) => void;
    onInputChange?: (value: string) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;
    onKeyPress?: (event: KeyboardEvent) => void;
}

export interface CodeEditorConfigProps {
    language: string | DataSource<string>;
}

export interface TabsProps {
    readonly?: DataSource<boolean>;
    openTabs?: ArrayDataSource<FileTreeNode>;

    onFocus?: (tab: FileTreeNode, cancel: () => void) => void;
    onClose?: (tab: FileTreeNode, cancel: () => void) => void;
    onBlur?: (tab: FileTreeNode, cancel: () => void) => void;
}

export interface CustomSidebarProps {
    icon: Renderable;
    label: Renderable;
    content: (width: DataSource<number>, height: DataSource<number>) => Renderable;
}

export interface CustomBottomPanelProps {
    icon: Renderable;
    label: Renderable;
    content: (width: DataSource<number>, height: DataSource<number>) => Renderable;
}

export interface CustomEditorProps {
    id: string;
    content: (width: DataSource<number>, height: DataSource<number>, activeFile: DataSource<FileTreeFile>) => Renderable;
}

export interface AurumCodeEditorProps {
    general: GeneralProps;
    leftSidebar?: {
        fileExplorer?: FileExplorerProps;
        custom?: CustomSidebarProps[];
    };
    rightSidebar?: {
        fileExplorer?: FileExplorerProps;
        custom?: CustomSidebarProps[];
    };
    bottomPanel?: {
        tabs?: TabsProps;
        console?: ConsoleProps;
        custom?: CustomBottomPanelProps[];
    };
    topPanel?: {
        tabs?: TabsProps;
        console?: ConsoleProps;
        custom?: CustomBottomPanelProps[];
    };
    content?: {
        editorSelector?: (file: FileTreeFile) => string;
        codeEditor?: CodeEditorConfigProps;
        customEditor?: CustomEditorProps[];
    };
}

export function AurumCodeEditor(props: AurumCodeEditorProps, children: Renderable[], api: AurumComponentAPI) {
    if (children.length) {
        throw new Error('AurumCodeEditor does not accept children');
    }

    props.general.width = DataSource.toDataSource(props.general.width);
    props.general.height = DataSource.toDataSource(props.general.height);

    if (!props.bottomPanel && !props.topPanel && !props.leftSidebar && !props.rightSidebar && !props.content) {
        return;
    }

    const openFile = new DataSource<FileTreeFile>(
        fileToFileEntry(props.general.openFile ? props.general.files.find((e) => e.path === props.general.openFile.value) : props.general.files.get(0))
    );

    return (
        <div
            style={combineAttribute(
                api.cancellationToken,
                props.general.style,
                props.general.width.transform(dsMap((w) => `width:${w}px;`)),
                props.general.height.transform(dsMap((h) => `height:${h}px;`))
            )}
            class={props.general.class}
        >
            <PanelComponent>
                {props.topPanel ? (
                    <PanelDockTop size={100} resizable>
                        {selectTop(props.topPanel, {
                            height: props.general.height,
                            openFile,
                            width: props.general.width
                        })}
                    </PanelDockTop>
                ) : undefined}
                <PanelDockLeft size={100} resizable>
                    {selectLeft(props.leftSidebar)}
                </PanelDockLeft>
                <PanelDockBottom size={100} resizable>
                    {selectBottom(props.bottomPanel, {
                        width: props.general.width,
                        height: new DataSource(100),
                        openFile
                    })}
                </PanelDockBottom>
                <PanelDockRight size={100} resizable>
                    {selectRight(props.rightSidebar, {
                        width: props.general.width,
                        height: props.general.height,
                        openFile
                    })}
                </PanelDockRight>
                <PanelContent>
                    {selectContent(props.content, {
                        width: props.general.width,
                        height: props.general.height,
                        openFile
                    })}
                </PanelContent>
            </PanelComponent>
        </div>
    );
}

function selectTop(
    top: AurumCodeEditorProps['topPanel'],
    general: {
        width: DataSource<number>;
        height: DataSource<number>;
        openFile: DataSource<FileTreeFile>;
    }
): Renderable {
    if (!top) {
        return undefined;
    }

    if (top.tabs) {
        return <TabsComponent width={general.width} {...top.tabs} />;
    }

    throw new Error('Not implemented');
}

function selectLeft(left: AurumCodeEditorProps['leftSidebar']): Renderable {
    if (!left) {
        return undefined;
    }

    throw new Error('Not implemented');
}

function selectBottom(
    bottom: AurumCodeEditorProps['bottomPanel'],
    general: {
        width: DataSource<number>;
        height: DataSource<number>;
        openFile: DataSource<FileTreeFile>;
    }
): Renderable {
    if (!bottom) {
        return undefined;
    }

    if (bottom.console) {
        return <ConsoleComponent width={general.width} height={general.height} />;
    }

    throw new Error('Not implemented');
}

function selectRight(
    right: AurumCodeEditorProps['rightSidebar'],
    general: {
        width: DataSource<number>;
        height: DataSource<number>;
        openFile: DataSource<FileTreeFile>;
    }
): Renderable {
    if (!right) {
        return undefined;
    }

    throw new Error('Not implemented');
}

function fileToFileEntry(file: { path: string; content: ArrayDataSource<string> | DataSource<Uint8Array> }): FileTreeFile {
    return {
        content: file.content,
        directory: new DataSource(file.path.split('/').slice(0, -1).join('/')),
        name: new DataSource(file.path.split('/').slice(-1)[0]),
        nodeType: 'file'
    };
}

function selectContent(
    content: AurumCodeEditorProps['content'],
    general: {
        width: DataSource<number>;
        height: DataSource<number>;
        openFile: DataSource<FileTreeFile>;
    }
): Renderable {
    if (!content) {
        return undefined;
    }

    const { openFile, height, width } = general;

    return openFile.transform(
        dsMap((file) => {
            const id = content.editorSelector?.(file);
            if (id && content.customEditor?.find((ce) => ce.id === id)) {
                return content.customEditor?.find((ce) => ce.id === id)?.content(width, height, openFile);
            } else {
                if (content.codeEditor) {
                    return <CodeEditor language={DataSource.toDataSource(content.codeEditor.language)} file={file} width={width} height={height} />;
                }
            }
        })
    );
}
