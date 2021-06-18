import { css } from '@emotion/css';
import { aurumify, currentTheme } from 'aurum-components';
import { Aurum } from 'aurumjs';
import { AbstractEditorProps } from '../abstract';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
	aurumify(
		[theme.fontFamily, theme.heading3FontSize, theme.baseFontColor, theme.themeColor2],
		(fontFamily, size, fontColor, color1) => css`
			width: 100%;
			height: 100%;
			background-color: ${color1};
			color: ${fontColor};
			font-family: ${fontFamily};
			font-size: ${size};

			display: flex;
			justify-content: center;
			align-items: center;
		`,
		lifecycleToken
	)
);

export interface UnknownEditorProps extends AbstractEditorProps {}

export function UnknownEditor(props: UnknownEditorProps) {
	return <div class={style}>Unknown file type</div>;
}
