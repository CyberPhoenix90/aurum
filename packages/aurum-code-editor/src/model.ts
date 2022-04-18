import { DataSource, ArrayDataSource } from 'aurumjs';

export type FileTreeNode = FileTreeFile | FileTreeFolder;

export interface FileTreeNodeCommon {
    directory: DataSource<string>;
    name: DataSource<string>;

    children?: FileTreeNode[];
}

export interface FileTreeFile extends FileTreeNodeCommon {
    nodeType: 'file';
    content: ArrayDataSource<string> | DataSource<Uint8Array>;
}

export interface FileTreeFolder extends FileTreeNodeCommon {
    open?: DataSource<boolean>;
    nodeType: 'folder';
}
