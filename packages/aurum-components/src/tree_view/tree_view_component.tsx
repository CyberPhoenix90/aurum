import { css } from '@emotion/css';
import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    DataSource,
    ReadOnlyArrayDataSource,
    ReadOnlyDataSource,
    Renderable,
    StyleType,
    dsDiff,
    dsMap,
    getValueOf
} from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';
import { TreeEntry } from './tree_view_model.js';
import { TreeEntryRenderable } from './tree_view_node.js';
import { FileTypePriority, TreeViewSorting, sortItems } from './tree_view_common.js';

export interface TreeViewComponentProps<T> {
    searchQuery?: ReadOnlyDataSource<string>;
    indentWidth?: number;
    cascadeFolderOpen?: boolean;
    arrowColor?: string | DataSource<string>;
    allowDragAndDrop?: boolean;
    allowFocus?: boolean;
    style?: StyleType;
    longFileNameBehavior?: 'hscroll' | 'wrap' | 'elipsis';
    fileTypePriority?: FileTypePriority;
    sorting?: TreeViewSorting;
    noEntriesMsg?: string;
    renaming?: DataSource<TreeEntry<T>>;
    entries: ReadOnlyArrayDataSource<TreeEntry<T>> | ArrayDataSource<TreeEntry<T>>;
    disableAutoOpenOnSelect?: boolean;
    canDrag?(draggedEntry: TreeEntry<T>): boolean;
    canDrop?(draggedEntry: TreeEntry<T>, targetEntry: TreeEntry<T>): boolean;
    onArrowClicked?(e: MouseEvent, entry: TreeEntry<T>): void;
    onEntrySelected?(entry: TreeEntry<T>): void;
    onEntryClicked?(e: MouseEvent, entry: TreeEntry<T>): void;
    onEntryDoubleClicked?(e: MouseEvent, entry: TreeEntry<T>): void;
    onKeyDown?(e: KeyboardEvent, focusedEntry: TreeEntry<T>): void;
    onKeyUp?(e: KeyboardEvent, focusedEntry: TreeEntry<T>): void;
    onEntryRightClicked?(e: MouseEvent, entry: TreeEntry<T>, ancestors: TreeEntry<T>[]): void;
    onEntryDrop?(draggedEntry: TreeEntry<T>, targetEntry: TreeEntry<T>): void;
}

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [
            theme.fontFamily,
            theme.baseFontSize,
            theme.baseFontColor,
            theme.highlightFontColor,
            theme.themeColor4,
            theme.themeColor1,
            theme.themeColor3,
            theme.themeColor2,
            theme.highlightColor1
        ],
        (fontFamily, size, fontColor, highlightFont, color4, color1, color3, color2, highlightColor1) => css`
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};

            .drop-ok {
                outline: white solid 1px !important;
            }

            .node {
                outline: none;
                padding-top: 2px;
                padding-bottom: 2px;
                user-select: none;
                display: flex;
                align-items: center;
                padding-left: 9px;
                min-height: 20px;

                &.hasFocus {
                    &.isActive {
                        border: 0;
                        margin: 0;
                        background-color: ${highlightColor1};
                    }

                    outline: 1px solid ${color4};

                    border-width: 1px 0;
                    background-color: ${color1};
                }

                .file-name-nowrap {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            .arrow-loading::before {
                content: '⏳';
                position: relative;
                padding-right: 4px;
            }

            .arrow-right::before {
                position: relative;
                padding-right: 4px;
                content: '▶';
            }

            .arrow-down::before {
                padding-right: 4px;
                content: '▼';
            }

            .no-arrow {
                padding-left: 18px;
            }
        `,
        lifecycleToken
    )
);

export function TreeViewComponent<T>(props: TreeViewComponentProps<T>) {
    return (
        <>
            {props.entries.length.transform(
                dsMap((length) =>
                    length === 0 ? (
                        <div style={props.style} class={[style, 'tree-view-component no-entries'] as any}>
                            {props.noEntriesMsg ?? 'No entries'}
                        </div>
                    ) : (
                        <div style={props.style} class={[style, 'tree-view-component'] as any}>
                            <RenderTreeView {...props}></RenderTreeView>
                        </div>
                    )
                )
            )}
        </>
    );
}

function RenderTreeView<T>(props: TreeViewComponentProps<T>, children: Renderable[], api: AurumComponentAPI): ArrayDataSource<any> {
    const focusedEntry = new DataSource<TreeEntry<any>>(undefined);

    focusedEntry.listen((entry) => {
        props.onEntrySelected?.(entry);
    }, api.cancellationToken);

    if (props.allowFocus) {
        props.renaming?.transform(dsDiff()).listen(({ oldValue, newValue }) => {
            if (newValue === undefined) {
                focusedEntry.update(oldValue);
            }
        }, api.cancellationToken);
    }

    const isActive = new DataSource(false);
    const dragState = { src: new DataSource<TreeEntry<any>>(), target: new DataSource<TreeEntry<any>>() };

    const entries = props.entries
        .sort(
            (a, b) => sortItems(a, b, props.sorting ?? TreeViewSorting.NONE, props.fileTypePriority ?? 'none'),
            getValueOf(props.entries)
                .map((e) => e.name)
                .filter((e) => e instanceof DataSource) as any as DataSource<TreeEntry<any>>[]
        )
        .map((e) => (
            <TreeEntryRenderable
                ancestors={[]}
                fileTypePriority={props.fileTypePriority}
                longFileNameBehavior={props.longFileNameBehavior ?? 'hscroll'}
                dragState={dragState}
                canDrag={props.canDrag ?? (() => true)}
                canDrop={props.canDrop ?? (() => true)}
                onEntryDrop={props.onEntryDrop}
                allowDragAndDrop={props.allowDragAndDrop}
                entry={e}
                focusData={{
                    focusedEntry,
                    isActive,
                    allowFocus: props.allowFocus
                }}
                disableAutoOpenOnSelect={props.disableAutoOpenOnSelect ?? false}
                events={{
                    onEntryDoubleClicked: props.onEntryDoubleClicked,
                    onEntryClicked: props.onEntryClicked,
                    onArrowClicked: props.onArrowClicked,
                    onEntryRightClicked: props.onEntryRightClicked,
                    onKeyDown: props.onKeyDown,
                    onKeyUp: props.onKeyUp
                }}
                renaming={props.renaming}
                sorting={props.sorting ?? TreeViewSorting.NONE}
                indentWidth={props.indentWidth ?? 10}
            />
        ));
    if (props.allowFocus) {
        api.cancellationToken.registerDomEvent(window, 'keydown', (e: KeyboardEvent) => {
            if (!isActive.value || !focusedEntry.value || props.renaming?.value) {
                return;
            }
            e.preventDefault();
            switch (e.key) {
                case 'ArrowLeft':
                    if (getValueOf(focusedEntry.value.children?.length)) {
                        if (focusedEntry.value.open.value) {
                            if (focusedEntry.value.open instanceof DataSource) {
                                focusedEntry.value.open.update(false);
                            } else {
                                focusedEntry.value.open.updateDownstream(false);
                            }
                        } else {
                            focusedEntry.update(parentOf(focusedEntry.value, props.entries, props.sorting, props.fileTypePriority) ?? focusedEntry.value);
                        }
                    } else {
                        focusedEntry.update(parentOf(focusedEntry.value, props.entries, props.sorting, props.fileTypePriority) ?? focusedEntry.value);
                    }
                    break;
                case 'ArrowRight':
                    if (getValueOf(focusedEntry.value.children?.length) || focusedEntry.value.lazyLoad) {
                        if (focusedEntry.value.open.value) {
                            focusedEntry.update(next(focusedEntry.value, props.entries, props.sorting, props.fileTypePriority) ?? focusedEntry.value);
                        } else {
                            if (focusedEntry.value.open instanceof DataSource) {
                                focusedEntry.value.open.update(true);
                            } else {
                                focusedEntry.value.open.updateDownstream(true);
                            }
                        }
                    }
                    break;
                case 'ArrowDown':
                    focusedEntry.update(next(focusedEntry.value, props.entries, props.sorting, props.fileTypePriority) ?? focusedEntry.value);
                    break;
                case 'ArrowUp':
                    focusedEntry.update(previous(focusedEntry.value, props.entries, props.sorting, props.fileTypePriority) ?? focusedEntry.value);
                    break;
            }
        });
    }

    return (
        <div
            onAttach={(node) => {
                api.cancellationToken.registerDomEvent(document, 'mouseup', (e: MouseEvent) => {
                    let ptr = e.target;
                    while (ptr) {
                        if (ptr === node) {
                            isActive.update(true);
                            return;
                        } else {
                            ptr = (ptr as HTMLElement).parentElement;
                        }
                    }

                    isActive.update(false);
                });
            }}
        >
            {entries}
        </div>
    );
}

function parentOf(
    pointer: TreeEntry<any>,
    entries: ReadOnlyArrayDataSource<TreeEntry<any>> | ArrayDataSource<TreeEntry<any>> | TreeEntry<any>[],
    sorting: TreeViewSorting,
    priority: FileTypePriority
): TreeEntry<any> {
    const iterator = iterateEntries(entries, sorting, priority);
    let value: TreeEntry<any>;
    while ((value = iterator.next().value)) {
        if (value.children && value.children.includes(pointer)) {
            return value;
        }
    }

    return undefined;
}

function next(
    pointer: TreeEntry<any>,
    entries: ReadOnlyArrayDataSource<TreeEntry<any>> | ArrayDataSource<TreeEntry<any>> | TreeEntry<any>[],
    sorting: TreeViewSorting,
    priority: FileTypePriority
): TreeEntry<any> {
    const iterator = iterateEntries(entries, sorting, priority);
    let value;
    while ((value = iterator.next().value)) {
        if (value === pointer) {
            return iterator.next().value;
        }
    }

    return undefined;
}

function previous(
    pointer: TreeEntry<any>,
    entries: ArrayDataSource<TreeEntry<any>> | ReadOnlyArrayDataSource<TreeEntry<any>> | TreeEntry<any>[],
    sorting: TreeViewSorting,
    priority: FileTypePriority
): TreeEntry<any> {
    const iterator = iterateEntries(entries, sorting, priority);
    let previous;
    let value;
    while ((value = iterator.next().value)) {
        if (value === pointer) {
            return previous;
        }
        previous = value;
    }

    return undefined;
}

function* iterateEntries(
    entries: ArrayDataSource<TreeEntry<any>> | ReadOnlyArrayDataSource<TreeEntry<any>> | TreeEntry<any>[],
    sorting: TreeViewSorting,
    priority: FileTypePriority
): IterableIterator<TreeEntry<any>> {
    const set = Array.isArray(entries) ? entries : entries.toArray();
    if (sorting) {
        set.sort((a, b) => sortItems(a, b, sorting, priority));
    }
    for (const e of set) {
        yield e;
        if (e.children?.length && e.open?.value) {
            yield* iterateEntries(e.children, sorting, priority);
        }
    }

    return undefined;
}
