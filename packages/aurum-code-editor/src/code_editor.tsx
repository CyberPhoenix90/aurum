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

export interface GeneralProps {
    theme?: DataSource<string>;
    width: DataSource<number>;
    height: DataSource<number>;

    style?: AttributeValue;
    class?: ClassType;
}

export type FileTreeNode = FileTreeFile | FileTreeFolder;

export interface FileTreeNodeCommon {
    path: string;
    name: string;

    open?: DataSource<boolean>;

    children?: FileTreeNode[];
}

export interface FileTreeFile extends FileTreeNodeCommon {
    nodeType: 'file';
    content: ArrayDataSource<string>;
}

export interface FileTreeFolder extends FileTreeNodeCommon {
    nodeType: 'folder';
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

export interface TabsProps {
    readonly?: DataSource<boolean>;
    openTabs?: ArrayDataSource<FileTreeNode>;

    onFocus?: (tab: FileTreeNode, cancel: () => void) => void;
    onClose?: (tab: FileTreeNode, cancel: () => void) => void;
    onBlur?: (tab: FileTreeNode, cancel: () => void) => void;
}

export interface CodeEditorProps {
    id: string;
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
        editorSelector: (file: FileTreeFile) => string;
        codeEditor?: CodeEditorProps;
        customEditor?: CustomEditorProps[];
    };
}

export function AurumCodeEditor(props: AurumCodeEditorProps, children: Renderable[], api: AurumComponentAPI) {
    if (children.length) {
        throw new Error('AurumCodeEditor does not accept children');
    }

    if (!props.bottomPanel && !props.topPanel && !props.leftSidebar && !props.rightSidebar && !props.content) {
        return;
    }

    return (
        <div
            style={combineAttribute(
                api.cancellationToken,
                props.general.style,
                props.general.width.transform(dsMap((w) => `width:${w}px;`)),
                props.general.height.transform(dsMap((h) => `height:${h}px;`))
            )}
            class={props.general.class}
        ></div>
    );
}
