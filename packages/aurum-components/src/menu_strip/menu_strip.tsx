import { ArrayDataSource, Aurum, AurumComponentAPI, AurumElementModel, ClassType, DataSource, dsUnique, Renderable, combineClass } from 'aurumjs';
import { currentTheme } from '../theme/theme';
import { css } from '@emotion/css';
import { aurumify } from '../utils';
import { Dialog } from '../dialog/dialog';
import { ContextMenu } from '../dialog/context_menu';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
	aurumify(
		[theme.fontFamily, theme.baseFontSize, theme.baseFontColor, theme.themeColor4, theme.themeColor2, theme.highlightColor1],
		(fontFamily, size, fontColor, color4, color2) => css`
			display: flex;
			width: 100%;
			color: ${fontColor};
			font-family: ${fontFamily};
			font-size: ${size};
			background-color: ${color2};

			> span {
				padding: 6px 8px;
				cursor: pointer;
				user-select: none;
			}

			> span:hover {
				background-color: ${color4};
			}
		`,
		lifecycleToken
	)
);

export function MenuStrip(
	props: {
		class?: ClassType;
		dialogSource: ArrayDataSource<Renderable>;
	},
	children: Renderable[]
): Renderable {
	const controller = {
		openId: new DataSource(-1),
		openState: new DataSource(false),
		dialogSource: props.dialogSource
	};

	const menus = children.filter((c) => (c as AurumElementModel<any>).factory === MenuStripMenu);
	for (const menu of menus) {
		if (!(menu as AurumElementModel<any>).props) {
			(menu as AurumElementModel<any>).props = {};
		}
		(menu as AurumElementModel<any>).props.controller = controller;
	}

	return <div class={combineClass(style, props.class)}>{children}</div>;
}

interface MenuStripController {
	openId: DataSource<number>;
	openState: DataSource<boolean>;
	dialogSource: ArrayDataSource<Renderable>;
}

let id = 0;

export function MenuStripMenuContent(props: {}, children: Renderable[]) {
	return undefined;
}

export function MenuStripMenu(props: {}, children: Renderable[], api: AurumComponentAPI) {
	const menuContent = children.find((c) => (c as AurumElementModel<any>).factory === MenuStripMenuContent);
	const menuId = id++;
	//@ts-ignore
	const magic: MenuStripController = props.controller;

	const isOpen = magic.openState.aggregate([magic.openId], (open, id) => open && id === menuId).transform(dsUnique());
	let dialog;
	let target;

	if (menuContent) {
		isOpen.listen((v) => {
			if (v) {
				dialog = (
					<Dialog
						onEscape={() => {
							magic.openState.update(false);
						}}
						onClickOutside={() => {
							magic.openState.update(false);
						}}
						onClickInside={() => {
							magic.openState.update(false);
						}}
						target={target}
						layout={{
							direction: 'down',
							targetPoint: 'start'
						}}
					>
						<ContextMenu>{(menuContent as AurumElementModel<any>).children}</ContextMenu>
					</Dialog>
				);
				magic.dialogSource.push(dialog);
			} else {
				magic.dialogSource.remove(dialog);
				dialog = undefined;
			}
		}, api.cancellationToken);
	}

	return (
		<span
			onMouseEnter={() => {
				magic.openId.update(menuId);
			}}
			onClick={() => {
				if (magic.openState.value) {
					magic.openState.update(false);
				} else {
					magic.openState.update(true);
					magic.openId.update(menuId);
				}
			}}
			onAttach={(n) => (target = n)}
		>
			{children}
		</span>
	);
}
