import { TabBar } from 'aurum-components';
import { ArrayDataSource, Aurum, DataSource } from 'aurumjs';
import { FileTreeNode } from './model.js';

export interface TabsProps {
    width: DataSource<number>;
    readonly?: DataSource<boolean>;
    openTabs?: ArrayDataSource<FileTreeNode>;

    onFocus?: (tab: FileTreeNode, cancel: () => void) => void;
    onClose?: (tab: FileTreeNode, cancel: () => void) => void;
    onBlur?: (tab: FileTreeNode, cancel: () => void) => void;
}

export function TabsComponent(props: TabsProps) {
    const selected = new DataSource<string>(undefined);

    return <TabBar canClose canReorder selected={selected}></TabBar>;
}
