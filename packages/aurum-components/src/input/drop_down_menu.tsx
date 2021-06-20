import { css } from '@emotion/css';
import { ArrayDataSource, Aurum, AurumComponentAPI, AurumElementModel, DataSource, dsMap, DuplexDataSource, Renderable, resolveChildren } from 'aurumjs';
import { Dialog } from '../dialog/dialog';
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';

const theme = aurumify([currentTheme], (theme, lifecycleToken) =>
	aurumify(
		[theme.fontFamily, theme.baseFontSize, theme.highlightFontColor, theme.themeColor1, theme.themeColor3, theme.themeColor4],
		(fontFamily, size, highlightFont, color1, color3, color4) => css`
			position: relative;
			display: inline-flex;
			justify-content: space-between;

			padding: 4px;
			font-family: ${fontFamily};
			font-size: ${size};
			outline: none;
			color: ${highlightFont};
			border-color: ${color4};
			background-color: ${color3};
			width: 100px;
			cursor: pointer;
		`,
		lifecycleToken
	)
);

const dropdownStyle = aurumify([currentTheme], (theme, lifecycleToken) =>
	aurumify(
		[theme.fontFamily, theme.baseFontSize, theme.highlightFontColor, theme.themeColor1, theme.themeColor3, theme.themeColor4],
		(fontFamily, size, highlightFont, color1, color3, color4) => css`
			position: relative;
			display: inline-flex;
			font-family: ${fontFamily};
			font-size: ${size};
			color: ${highlightFont};
			border: 1px solid ${color4};
			background-color: ${color1};
			width: 100px;

			ol {
				margin: 0;
				padding-left: 0;
				width: 100%;
				list-style: none;
			}

			li {
				user-select: none;
				padding-left: 4px;
				cursor: pointer;
			}

			li.highlight {
				background-color: ${color3};
			}
		`,
		lifecycleToken
	)
);

export interface DropDownMenuProps<T> {
	dialogSource: ArrayDataSource<Renderable>;
	selectedValue?: DuplexDataSource<T> | DataSource<T>;
	selectedIndex?: DuplexDataSource<number>;
	isOpen?: DataSource<boolean>;

	onChange?(selectedValue: T, selectedIndex: number, previousIndex: number): void;
}

export function DropDownMenu<T>(props: DropDownMenuProps<T>, children: Renderable[], api: AurumComponentAPI) {
	const childSource: ArrayDataSource<AurumElementModel<{ value: T }>> = resolveChildren(
		children,
		api.cancellationToken,
		(e) => (e as AurumElementModel<any>).factory === DropDownMenuOption
	);

	const isOpen = props.isOpen ?? new DataSource(false);
	const selectedIndex = props.selectedIndex ?? new DuplexDataSource(0);
	const highlightIndex = new DataSource(selectedIndex.value);

	let root: HTMLDivElement;
	let childContainer: HTMLOListElement;
	let dialog;

	if (props.selectedValue) {
		selectedIndex.listen((index) => {
			const value = childSource.get(index)?.props.value;
			if (props.selectedValue.value !== value) {
				if (props.selectedValue instanceof DataSource) {
					props.selectedValue.update(value);
				} else {
					props.selectedValue.updateUpstream(value);
				}
			}
		}, api.cancellationToken);
		if (props.selectedValue instanceof DataSource) {
			props.selectedValue.listen(handleValueChange<T>(childSource, selectedIndex), api.cancellationToken);
		} else {
			props.selectedValue.listenDownstream(handleValueChange<T>(childSource, selectedIndex), api.cancellationToken);
		}
	}

	childSource.listen(() => selectedIndex.updateDownstream(selectedIndex.value));

	isOpen.listenAndRepeat((open) => {
		if (open) {
			dialog = (
				<Dialog
					style={`width:${root.clientWidth}px;`}
					class={dropdownStyle}
					target={root}
					layout={{
						direction: 'down',
						targetPoint: 'start',
						orientationX: 'left',
						orientationY: 'top'
					}}
					onClickInside={() => {
						isOpen.update(false);
					}}
					onClickOutside={() => {
						isOpen.update(false);
					}}
				>
					<ol onAttach={(e) => (childContainer = e)}>
						{childSource.map((e) => (
							<li
								onMouseEnter={() => {
									highlightIndex.update(childSource.indexOf(e));
								}}
								class={highlightIndex.transform(dsMap((v) => (childSource.indexOf(e) === v ? 'highlight' : '')))}
								onClick={() => {
									selectedIndex.updateUpstream(childSource.indexOf(e));
								}}
							>
								{e.children}
							</li>
						))}
					</ol>
				</Dialog>
			);

			props.dialogSource.push(dialog);
		} else {
			props.dialogSource.remove(dialog);
		}
	});

	return (
		<div
			tabindex="0"
			onKeyDown={(e) => {
				switch (e.key) {
					case 'Escape':
						if (isOpen.value) {
							isOpen.update(false);
						}
						break;
					case 'ArrowDown':
						if (isOpen.value) {
							if (highlightIndex.value < childSource.length.value - 1) {
								highlightIndex.update(highlightIndex.value + 1);
							} else {
								highlightIndex.update(0);
							}
						} else {
							if (selectedIndex.value < childSource.length.value - 1) {
								selectedIndex.updateUpstream(selectedIndex.value + 1);
							} else {
								selectedIndex.updateUpstream(0);
							}
						}
						break;
					case 'ArrowUp':
						if (isOpen.value) {
							if (highlightIndex.value > 0) {
								highlightIndex.update(highlightIndex.value - 1);
							} else {
								highlightIndex.update(childSource.length.value - 1);
							}
						} else {
							if (selectedIndex.value > 0) {
								selectedIndex.updateUpstream(selectedIndex.value - 1);
							} else {
								selectedIndex.updateUpstream(childSource.length.value - 1);
							}
						}
						break;
					case 'Enter':
					case ' ':
						if (isOpen.value) {
							selectedIndex.updateUpstream(highlightIndex.value);
							isOpen.update(false);
						} else {
							isOpen.update(true);
						}
						break;
					default:
						if (e.key.length === 1) {
							const selectedChild = childContainer.children[highlightIndex.value];
							if (selectedChild && selectedChild.textContent[0].toLowerCase() === e.key) {
								for (let i = highlightIndex.value + 1; i < childContainer.children.length; i++) {
									if (childContainer.children[i].textContent[0].toLowerCase() === e.key) {
										highlightIndex.update(i);
										return;
									}
								}
							}
							let i = 0;
							for (const c of childContainer.children) {
								if (c.textContent[0].toLowerCase() === e.key) {
									highlightIndex.update(i);
									break;
								}
								i++;
							}
						}
				}
			}}
			onClick={() => {
				if (!isOpen.value) {
					isOpen.update(true);
				}
			}}
			onAttach={(e) => (root = e)}
			class={theme}
		>
			<div>
				{selectedIndex.transform(
					dsMap((s) => childSource.get(s).children),
					api.cancellationToken
				)}
			</div>
			<div>˅</div>
		</div>
	);
}

function handleValueChange<T>(childSource: ArrayDataSource<AurumElementModel<{ value: T }>>, selectedIndex: DuplexDataSource<number>): any {
	return (value) => {
		const index = childSource.findIndex((c) => c.props.value === value);
		if (selectedIndex.value !== index) {
			selectedIndex.updateUpstream(index);
		}
	};
}

export function DropDownMenuOption<T>(props: { value: T }) {
	return undefined;
}
