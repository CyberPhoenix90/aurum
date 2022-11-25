import { css } from '@emotion/css';
import {
    ArrayDataSource,
    AttributeValue,
    Aurum,
    aurumClassName,
    AurumComponentAPI,
    DataSource,
    dsDiff,
    dsMap,
    getValueOf,
    ReadOnlyArrayDataSource,
    ReadOnlyDataSource,
    Renderable
} from 'aurumjs';
import { TextField } from '../input/text_field.js';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';
import { TreeEntry } from './tree_view_model.js';

export enum TreeViewSorting {
    NONE,
    ALPHABETICAL_ASC,
    ALPHABETICAL_DESC,
    FOLDERS_ALPHABETICAL_ASC_FILES_NONE,
    FOLDERS_ALPHABETICAL_DESC_FILES_NONE
}

export type FileTypePriority = 'none' | 'folders' | 'files';

export interface TreeViewComponentProps<T> {
    searchQuery?: ReadOnlyDataSource<string>;
    indentWidth?: number;
    cascadeFolderOpen?: boolean;
    arrowColor?: string | DataSource<string>;
    allowDragAndDrop?: boolean;
    allowFocus?: boolean;
    style?: AttributeValue;
    longFileNameBehavior?: 'hscroll' | 'wrap' | 'elipsis';
    fileTypePriority?: FileTypePriority;
    sorting?: TreeViewSorting;
    noEntriesMsg?: string;
    renaming?: DataSource<TreeEntry<T>>;
    entries: ReadOnlyArrayDataSource<TreeEntry<T>> | ArrayDataSource<TreeEntry<T>>;
    canDrag?(draggedEntry: TreeEntry<T>): boolean;
    canDrop?(draggedEntry: TreeEntry<T>, targetEntry: TreeEntry<T>): boolean;
    onArrowClicked?(e: MouseEvent, entry: TreeEntry<T>): void;
    onEntrySelected?(entry: TreeEntry<T>): void;
    onEntryClicked?(e: MouseEvent, entry: TreeEntry<T>): void;
    onEntryDoubleClicked?(e: MouseEvent, entry: TreeEntry<T>): void;
    onKeyDown?(e: KeyboardEvent, focusedEntry: TreeEntry<T>): void;
    onKeyUp?(e: KeyboardEvent, focusedEntry: TreeEntry<T>): void;
    onEntryRightClicked?(e: MouseEvent, entry: TreeEntry<T>): void;
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
            background-color: ${color1};
            height: 100%;
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

                    margin: -1px 0;
                    border: 1px solid ${color4};
                    border-width: 1px 0;
                    background-color: ${color1};
                }

                .file-name-nowrap {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
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
                    ) : undefined
                )
            )}
            <div style={props.style} class={[style, 'tree-view-component'] as any}>
                <RenderTreeView {...props}></RenderTreeView>
            </div>
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
                    if (getValueOf(focusedEntry.value.children?.length)) {
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

function sortItems(a: TreeEntry<any>, b: TreeEntry<any>, sorting: TreeViewSorting, priority: FileTypePriority): number {
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

interface NodeEvents {
    onEntryDoubleClicked;
    onEntryClicked;
    onArrowClicked;
    onEntryRightClicked;
    onKeyDown;
    onKeyUp;
}

interface FocusData {
    focusedEntry: DataSource<TreeEntry<any>>;
    isActive: DataSource<boolean>;
    allowFocus: boolean;
}

function TreeEntryRenderable(
    props: {
        fileTypePriority: FileTypePriority;
        longFileNameBehavior: 'hscroll' | 'wrap' | 'elipsis';
        canDrag(draggedEntry: TreeEntry<any>): boolean;
        canDrop(draggedEntry: TreeEntry<any>, targetEntry: TreeEntry<any>): boolean;
        onEntryDrop?(draggedEntry: TreeEntry<any>, targetEntry: TreeEntry<any>): void;
        dragState: { src: DataSource<TreeEntry<void>>; target: DataSource<TreeEntry<void>> };
        allowDragAndDrop: boolean;
        entry: TreeEntry<any>;
        focusData: FocusData;
        events: NodeEvents;
        renaming: DataSource<TreeEntry<any>>;
        sorting: TreeViewSorting;
        indentWidth: number;
        indent?: number;
    },
    children: Renderable[],
    api: AurumComponentAPI
): Renderable[] {
    const { entry, events, focusData, indent = 0, indentWidth, renaming, sorting, fileTypePriority } = props;
    if (entry.open === undefined && isDirectory(entry)) {
        entry.open = new DataSource(false);
    }
    const dropOk = new DataSource(false);

    const className = aurumClassName({
        node: true,
        hasFocus: focusData.focusedEntry.transform(dsMap((s) => s === entry)),
        isActive: focusData.isActive,
        'drop-ok': dropOk
    });

    const result = [];
    result.push(
        <div
            onDragEnter={(e) => {
                if (props.dragState.src.value === entry) {
                    return;
                }
                props.dragState.target.update(undefined);
                if (props.canDrop(props.dragState.src.value, entry)) {
                    props.dragState.target.update(entry);
                    dropOk.update(true);
                }
            }}
            onDragLeave={() => {
                if (props.dragState.src.value === entry) {
                    return;
                }
                dropOk.update(false);
            }}
            onDragStart={(e) => {
                if (!props.canDrag(entry)) {
                    e.preventDefault();
                    return;
                }

                if (props.dragState.src.value === entry) {
                    return;
                }
                props.dragState.src.update(entry);
            }}
            onDragEnd={() => {
                if (!props.dragState.target.value) {
                    return;
                }
                if (props.canDrop(props.dragState.src.value, props.dragState.target.value)) {
                    props.onEntryDrop?.(props.dragState.src.value, props.dragState.target.value);
                    props.dragState.src.update(undefined);
                    props.dragState.target.update(undefined);
                }
            }}
            draggable={props.allowDragAndDrop ? 'true' : 'false'}
            onAttach={(n) => {
                focusData.focusedEntry.listenAndRepeat((e) => {
                    if (props.renaming?.value === undefined && e === entry) {
                        n.focus();
                    }
                }, api.cancellationToken);
            }}
            class={className}
            onMouseUp={() => {
                if (focusData.allowFocus) {
                    focusData.focusedEntry.update(entry);
                    focusData.isActive.update(true);
                }
            }}
            tabindex="-1"
            onKeyDown={(e) => {
                props.events.onKeyDown?.(e, entry);
            }}
            onKeyUp={(e) => {
                props.events.onKeyUp?.(e, entry);
            }}
            onContextMenu={(e) => {
                if (renaming?.value && renaming?.value.name === entry.name) {
                    return;
                } else if (renaming?.value) {
                    renaming.update(undefined);
                }
                if (focusData.allowFocus) {
                    focusData.focusedEntry.update(entry);
                    focusData.isActive.update(true);
                }
                events.onEntryRightClicked?.(e, entry);
            }}
            onDblClick={(event) => events.onEntryDoubleClicked?.(event, entry)}
            onClick={(event) => {
                if (entry.open instanceof DataSource) {
                    entry.open.update(!entry.open.value);
                } else {
                    entry.open.updateDownstream(!entry.open.value);
                }
                events.onEntryClicked?.(event, entry);
            }}
            style={`padding-left:${indent * indentWidth}px; ${events.onEntryClicked ? 'cursor:pointer;' : ''}`}
        >
            <div
                onClick={(event) => {
                    events.onArrowClicked?.(event, entry);
                }}
                class={getArrowClass(entry)}
            ></div>
            {renaming?.withInitial(undefined).transform(
                dsMap((ren) => {
                    if (ren && ren.name === entry.name && entry.name instanceof DataSource) {
                        const temp = new DataSource(getValueOf(entry.name));
                        return (
                            <TextField
                                style="width: 100%;"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                onAttach={(input) => input.focus()}
                                onBlur={() => {
                                    if (renaming?.value) {
                                        (entry.name as DataSource<string>).update(temp.value || getValueOf(entry.name));
                                        renaming.update(undefined);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        renaming?.update(undefined);
                                    } else if (e.key === 'Enter') {
                                        (entry.name as DataSource<string>).update(temp.value || getValueOf(entry.name));
                                        renaming?.update(undefined);
                                    }
                                }}
                                value={temp}
                            ></TextField>
                        );
                    } else {
                        return renderEntryDom(entry, props.longFileNameBehavior === 'hscroll');
                    }
                }),
                api.cancellationToken
            ) ?? renderEntryDom(entry, props.longFileNameBehavior === 'hscroll')}
        </div>
    );
    if (isDirectory(entry)) {
        result.push(
            entry.open.transform(
                dsMap((open) => {
                    if (open) {
                        return (
                            entry.children.sort(
                                (a, b) => sortItems(a, b, sorting, fileTypePriority),
                                getValueOf(entry.children)
                                    .map((e) => e.name)
                                    .filter((e) => e instanceof DataSource) as any as DataSource<TreeEntry<any>>[]
                            ) as ArrayDataSource<TreeEntry<any>>
                        ).map((c) => (
                            <TreeEntryRenderable
                                fileTypePriority={fileTypePriority}
                                longFileNameBehavior={props.longFileNameBehavior ?? 'hscroll'}
                                canDrag={props.canDrag}
                                canDrop={props.canDrop}
                                onEntryDrop={props.onEntryDrop}
                                allowDragAndDrop={props.allowDragAndDrop}
                                dragState={props.dragState}
                                entry={c}
                                renaming={renaming}
                                sorting={sorting}
                                focusData={focusData}
                                events={events}
                                indentWidth={indentWidth}
                                indent={indent + 1}
                            ></TreeEntryRenderable>
                        ));
                    } else {
                        return undefined;
                    }
                })
            )
        );
    }

    return <div>{result}</div>;
}

function renderEntryDom(entry: TreeEntry<any>, nowrap: boolean): Renderable {
    const name = aurumClassName({
        'file-name-nowrap': nowrap
    });

    return entry.renderable ? (
        entry.renderable
    ) : (
        <div title={entry.title} class={name}>
            {entry.name}
        </div>
    );
}

function isFile(entry: TreeEntry<any>): boolean {
    return !entry.children;
}

function isDirectory(entry: TreeEntry<any>): boolean {
    return !!entry.children;
}

function getArrowClass(entry: TreeEntry<any>): DataSource<string> | string {
    if (entry.children instanceof ArrayDataSource) {
        if (isDirectory(entry)) {
            return entry.children.length.aggregate([entry.open], (childrenCount, open) =>
                childrenCount === 0 ? 'no-arrow' : open ? 'arrow-down' : 'arrow-right'
            );
        } else {
            return 'no-arrow';
        }
    } else {
        if (entry.children?.length) {
            return entry.open.transform(dsMap((open) => (open ? 'arrow-down' : 'arrow-right')));
        } else {
            return 'no-arrow';
        }
    }
}
