import { TextField } from '../input/text_field.js';
import { FileTypePriority, TreeViewSorting, isDirectory, sortItems } from './tree_view_common.js';
import { TreeEntry } from './tree_view_model.js';
import { Aurum, ArrayDataSource, DataSource, dsMap, getValueOf, aurumClassName, Renderable, AurumComponentAPI } from 'aurumjs';

interface NodeEvents<T> {
    onEntryDoubleClicked?(e: MouseEvent, entry: TreeEntry<T>, ancestors: TreeEntry<T>[]): void;
    onEntryClicked?(e: MouseEvent, entry: TreeEntry<T>, ancestors: TreeEntry<T>[]): void;
    onArrowClicked?(e: MouseEvent, entry: TreeEntry<T>, ancestors: TreeEntry<T>[]): void;
    onEntryRightClicked?(e: MouseEvent, entry: TreeEntry<T>, ancestors: TreeEntry<T>[]): void;
    onKeyDown?(e: KeyboardEvent, focusedEntry: TreeEntry<T>, ancestors: TreeEntry<T>[]): void;
    onKeyUp?(e: KeyboardEvent, focusedEntry: TreeEntry<T>, ancestors: TreeEntry<T>[]): void;
}

interface FocusData {
    focusedEntry: DataSource<TreeEntry<any>>;
    isActive: DataSource<boolean>;
    allowFocus: boolean;
}

interface TreeViewNodeProps {
    ancestors: TreeEntry<any>[];
    fileTypePriority: FileTypePriority;
    longFileNameBehavior: 'hscroll' | 'wrap' | 'elipsis';
    canDrag(draggedEntry: TreeEntry<any>): boolean;
    canDrop(draggedEntry: TreeEntry<any>, targetEntry: TreeEntry<any>): boolean;
    onEntryDrop?(draggedEntry: TreeEntry<any>, targetEntry: TreeEntry<any>): void;
    dragState: {
        src: DataSource<TreeEntry<void>>;
        target: DataSource<TreeEntry<void>>;
    };
    allowDragAndDrop: boolean;
    entry: TreeEntry<any>;
    focusData: FocusData;
    events: NodeEvents<any>;
    renaming: DataSource<TreeEntry<any>>;
    sorting: TreeViewSorting;
    indentWidth: number;
    indent?: number;
}

export function TreeEntryRenderable(props: TreeViewNodeProps, children: Renderable[], api: AurumComponentAPI): Renderable[] {
    const { entry, events, focusData, indent = 0, indentWidth, renaming, sorting, fileTypePriority } = props;
    if (entry.lazyLoad && !entry.children) {
        entry.children = new ArrayDataSource();
    }

    const loading = new DataSource(false);
    const loaded = new DataSource(false);

    if (entry.open === undefined && isDirectory(entry)) {
        entry.open = new DataSource(false);
    }

    if (entry.lazyLoad) {
        entry.open.listenOnce(() => {
            loading.update(true);
            entry
                .lazyLoad()
                .then((children) => {
                    if (children) {
                        (entry.children as ArrayDataSource<any>).push(...children);
                    }
                })
                .finally(() => {
                    loading.update(false);
                    loaded.update(true);
                });
        });
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
                props.events.onKeyDown?.(e, entry, props.ancestors);
            }}
            onKeyUp={(e) => {
                props.events.onKeyUp?.(e, entry, props.ancestors);
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
                events.onEntryRightClicked?.(e, entry, props.ancestors);
            }}
            onDblClick={(event) => events.onEntryDoubleClicked?.(event, entry, props.ancestors)}
            onClick={(event) => {
                if (entry.open) {
                    if (entry.open instanceof DataSource) {
                        entry.open.update(!entry.open.value);
                    } else {
                        entry.open.updateDownstream(!entry.open.value);
                    }
                }
                events.onEntryClicked?.(event, entry, props.ancestors);
            }}
            style={`padding-left:${indent * indentWidth}px; ${events.onEntryClicked ? 'cursor:pointer;' : ''}`}
        >
            <div
                onClick={(event) => {
                    events.onArrowClicked?.(event, entry, props.ancestors);
                }}
                class={getArrowClass(entry, loading, loaded)}
            ></div>
            {renaming?.withInitial(undefined).transform(
                dsMap((ren) => {
                    if (ren && ren.name === entry.name && entry.name instanceof DataSource) {
                        const temp = new DataSource(getValueOf(entry.name));
                        return (
                            <>
                                <EntryIcon icon={entry.icon} />
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
                            </>
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
                        const ancestors = [entry, ...props.ancestors];
                        return (
                            entry.children.sort(
                                (a, b) => sortItems(a, b, sorting, fileTypePriority),
                                getValueOf(entry.children)
                                    .map((e) => e.name)
                                    .filter((e) => e instanceof DataSource) as any as DataSource<TreeEntry<any>>[]
                            ) as ArrayDataSource<TreeEntry<any>>
                        ).map((c) => (
                            <TreeEntryRenderable
                                ancestors={ancestors}
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
    return entry.renderable ? (
        entry.renderable
    ) : (
        <div
            title={entry.title}
            class={{
                'file-name-nowrap': nowrap
            }}
        >
            <EntryIcon icon={entry.icon} />
            {entry.name}
        </div>
    );
}

function EntryIcon(props: { icon: string | Renderable }): Renderable {
    if (props.icon) {
        if (typeof props.icon === 'string') {
            return (
                <i
                    style={{
                        marginRight: '4px'
                    }}
                    class={props.icon}
                ></i>
            );
        }
        return props.icon;
    } else {
        return undefined;
    }
}

function getArrowClass(entry: TreeEntry<any>, loading: DataSource<boolean>, loaded: DataSource<boolean>): DataSource<string> | string {
    if (entry.children instanceof ArrayDataSource) {
        if (isDirectory(entry)) {
            return entry.children.length.aggregate([entry.open, loading, loaded], (childrenCount, open, loading, loaded) => {
                if (loading) {
                    return 'arrow-loading';
                }

                if (entry.lazyLoad && !loaded) {
                    return 'arrow-right';
                }

                if (childrenCount === 0) {
                    return 'no-arrow';
                }

                return open ? 'arrow-down' : 'arrow-right';
            });
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
