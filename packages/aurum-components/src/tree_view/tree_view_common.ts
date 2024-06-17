import { getValueOf } from 'aurumjs';
import { TreeEntry } from './tree_view_model.js';

export enum TreeViewSorting {
    NONE,
    ALPHABETICAL_ASC,
    ALPHABETICAL_DESC,
    FOLDERS_ALPHABETICAL_ASC_FILES_NONE,
    FOLDERS_ALPHABETICAL_DESC_FILES_NONE
}

export type FileTypePriority = 'none' | 'folders' | 'files';

export function isFile(entry: TreeEntry<any>): boolean {
    return !entry.children && !entry.lazyLoad;
}

export function isDirectory(entry: TreeEntry<any>): boolean {
    return !!entry.children || !!entry.lazyLoad;
}

export function sortItems(a: TreeEntry<any>, b: TreeEntry<any>, sorting: TreeViewSorting, priority: FileTypePriority): number {
    if (priority === 'files') {
        if (isFile(a) && isDirectory(b)) {
            return -1;
        } else if (isDirectory(a) && isFile(b)) {
            return 1;
        }
    } else if (priority === 'folders') {
        if (isFile(a) && isDirectory(b)) {
            return 1;
        } else if (isDirectory(a) && isFile(b)) {
            return -1;
        }
    }

    switch (sorting) {
        case TreeViewSorting.NONE:
            return 1;
        case TreeViewSorting.ALPHABETICAL_ASC:
            return getValueOf(a.name).localeCompare(getValueOf(b.name));
        case TreeViewSorting.ALPHABETICAL_DESC:
            return getValueOf(b.name).localeCompare(getValueOf(a.name));
        case TreeViewSorting.FOLDERS_ALPHABETICAL_ASC_FILES_NONE:
            if (isDirectory(a) && isFile(b)) {
                return -1;
            } else if (isFile(a) && isDirectory(b)) {
                return 1;
            } else if (isDirectory(a) && isDirectory(b)) {
                return getValueOf(a.name).localeCompare(getValueOf(b.name));
            } else {
                return 1;
            }
        case TreeViewSorting.FOLDERS_ALPHABETICAL_DESC_FILES_NONE:
            if (isDirectory(a) && isFile(b)) {
                return -1;
            } else if (isFile(a) && isDirectory(b)) {
                return 1;
            } else if (isDirectory(a) && isDirectory(b)) {
                return getValueOf(b.name).localeCompare(getValueOf(a.name));
            } else {
                return 1;
            }
        default:
            throw new Error('Invalid sort option');
    }
}
