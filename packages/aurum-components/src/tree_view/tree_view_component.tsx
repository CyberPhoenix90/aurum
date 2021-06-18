import { css } from '@emotion/css';
import {
	ArrayDataSource,
	AttributeValue,
	Aurum,
	aurumClassName,
	AurumComponentAPI,
	DataSource,
	DefaultSwitchCase,
	dsDiff,
	dsMap,
	getValueOf,
	Renderable,
	Switch,
	SwitchCase
} from 'aurumjs';
import { TextField } from '../input/text_field';
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';
import { TreeEntry } from './tree_view_model';

export enum TreeViewSorting {
	NONE,
	DIRECTORY_FIRST_THEN_NONE,
	FILE_FIRST_THEN_NONE,
	DIRECTORY_FIRST_THEN_ALPHABETIC,
	FILE_FIRST_THEN_ALPHABETIC
}

export interface TreeViewComponentProps<T> {
	indentWidth?: number;
	arrowColor?: string | DataSource<string>;
	allowDragAndDrop?: boolean;
	allowFocus?: boolean;
	style?: AttributeValue;

	sorting?: TreeViewSorting;
	noEntriesMsg?: string;
	renaming?: DataSource<TreeEntry<T>>;
	entries: ArrayDataSource<TreeEntry<T>>;
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
				padding-left: 9px;

				&.hasFocus {
					&.isActive {
						border: 0;
						margin: 0;
						background-color: ${highlightColor1};
					}

					margin: -1px;
					border: 1px solid ${color4};
					background-color: ${color1};
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
		<Switch state={props.entries.length}>
			<SwitchCase when={0}>
				<div style={props.style} class={[style, 'tree-view-component no-entries'] as any}>
					{props.noEntriesMsg ?? 'No entries'}
				</div>
			</SwitchCase>
			<DefaultSwitchCase>
				<div style={props.style} class={[style, 'tree-view-component'] as any}>
					<RenderTreeView {...props}></RenderTreeView>
				</div>
			</DefaultSwitchCase>
		</Switch>
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
			(a, b) => sortItems(a, b, props.sorting ?? TreeViewSorting.NONE),
			getValueOf(props.entries)
				.map((e) => e.name)
				.filter((e) => e instanceof DataSource) as any as DataSource<TreeEntry<any>>[]
		)
		.map((e) => (
			<TreeEntryRenderable
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
			switch (e.key) {
				case 'ArrowLeft':
					if (getValueOf(focusedEntry.value.children?.length)) {
						if (focusedEntry.value.open.value) {
							focusedEntry.value.open.update(false);
						} else {
							focusedEntry.update(parentOf(focusedEntry.value, props.entries, props.sorting) ?? focusedEntry.value);
						}
					} else {
						focusedEntry.update(parentOf(focusedEntry.value, props.entries, props.sorting) ?? focusedEntry.value);
					}
					break;
				case 'ArrowRight':
					if (getValueOf(focusedEntry.value.children?.length)) {
						if (focusedEntry.value.open.value) {
							focusedEntry.update(next(focusedEntry.value, props.entries, props.sorting) ?? focusedEntry.value);
						} else {
							focusedEntry.value.open.update(true);
						}
					}
					break;
				case 'ArrowDown':
					focusedEntry.update(next(focusedEntry.value, props.entries, props.sorting) ?? focusedEntry.value);
					break;
				case 'ArrowUp':
					focusedEntry.update(previous(focusedEntry.value, props.entries, props.sorting) ?? focusedEntry.value);
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

function parentOf(pointer: TreeEntry<any>, entries: ArrayDataSource<TreeEntry<any>> | TreeEntry<any>[], sorting: TreeViewSorting): TreeEntry<any> {
	const iterator = iterateEntries(entries, sorting);
	let value: TreeEntry<any>;
	while ((value = iterator.next().value)) {
		if (value.children && value.children.includes(pointer)) {
			return value;
		}
	}
}

function next(pointer: TreeEntry<any>, entries: ArrayDataSource<TreeEntry<any>> | TreeEntry<any>[], sorting: TreeViewSorting): TreeEntry<any> {
	const iterator = iterateEntries(entries, sorting);
	let value;
	while ((value = iterator.next().value)) {
		if (value === pointer) {
			return iterator.next().value;
		}
	}
}

function previous(pointer: TreeEntry<any>, entries: ArrayDataSource<TreeEntry<any>> | TreeEntry<any>[], sorting: TreeViewSorting): TreeEntry<any> {
	const iterator = iterateEntries(entries, sorting);
	let previous;
	let value;
	while ((value = iterator.next().value)) {
		if (value === pointer) {
			return previous;
		}
		previous = value;
	}
}

function* iterateEntries(entries: ArrayDataSource<TreeEntry<any>> | TreeEntry<any>[], sorting: TreeViewSorting): IterableIterator<TreeEntry<any>> {
	const set = Array.isArray(entries) ? entries : entries.toArray();
	set.sort((a, b) => sortItems(a, b, sorting));
	for (const e of set) {
		yield e;
		if (e.children?.length && e.open?.value) {
			yield* iterateEntries(e.children, sorting);
		}
	}

	return undefined;
}

function sortItems(a: TreeEntry<any>, b: TreeEntry<any>, sorting: TreeViewSorting) {
	switch (sorting) {
		case TreeViewSorting.NONE:
			return 1;
		case TreeViewSorting.FILE_FIRST_THEN_NONE:
			return !isDirectory(a) ? -1 : 1;
		case TreeViewSorting.DIRECTORY_FIRST_THEN_NONE:
			return isDirectory(a) ? -1 : 1;
		case TreeViewSorting.DIRECTORY_FIRST_THEN_ALPHABETIC:
			return isDirectory(a) && !isDirectory(b) ? -1 : isDirectory(b) && !isDirectory(a) ? 1 : getValueOf(a.name).localeCompare(getValueOf(b.name));
		case TreeViewSorting.FILE_FIRST_THEN_ALPHABETIC:
			return !isDirectory(a) && isDirectory(b) ? -1 : !isDirectory(b) && isDirectory(a) ? 1 : getValueOf(a.name).localeCompare(getValueOf(b.name));
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
	const { entry, events, focusData, indent = 0, indentWidth, renaming, sorting } = props;
	if (entry.open === undefined) {
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
				entry.open.update(!entry.open.value);
				events.onEntryClicked?.(event, entry);
			}}
			style={`padding-left:${indent * indentWidth}px; ${events.onEntryClicked ? 'cusor:pointer;' : ''}`}
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
						return renderEntryDom(entry);
					}
				}),
				api.cancellationToken
			) ?? renderEntryDom(entry)}
		</div>
	);
	if (isDirectory(entry)) {
		result.push(
			entry.open.transform(
				dsMap((open) => {
					if (open) {
						return (
							entry.children.sort(
								(a, b) => sortItems(a, b, sorting),
								getValueOf(entry.children)
									.map((e) => e.name)
									.filter((e) => e instanceof DataSource) as any as DataSource<TreeEntry<any>>[]
							) as ArrayDataSource<TreeEntry<any>>
						).map((c) => (
							<TreeEntryRenderable
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
					}
				})
			)
		);
	}

	return <div>{result}</div>;
}

function renderEntryDom(entry: TreeEntry<any>): any {
	return entry.renderable ? entry.renderable : <div>{entry.name}</div>;
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
