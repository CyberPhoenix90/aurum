import { css } from '@emotion/css';
import { aurumify, currentTheme } from 'aurum-components';
import { aurumClassName, ArrayDataSource, Aurum, DuplexDataSource, dsMap } from 'aurumjs';
import { parse } from 'path';
import { ProjectFile } from '../../models/project_file';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
	aurumify(
		[
			theme.fontFamily,
			theme.baseFontSize,
			theme.baseFontColor,
			theme.disabledFontColor,
			theme.themeColor4,
			theme.themeColor1,
			theme.highlightColor1,
			theme.detailFontSize
		],
		(fontFamily, size, fontColor, disabledFontColor, color4, color1, highlightColor, detailFontSize) => css`
			background-color: ${color1};
			color: ${fontColor};
			font-family: ${fontFamily};
			font-size: ${size};
			user-select: none;
			list-style: none;
			width: 400px;
			margin: 0;
			padding-inline-start: 0;
			.highlight {
				background-color: ${highlightColor};
				border-top: 1px solid ${color4};
				border-bottom: 1px solid ${color4};
			}
			.hint {
				margin-left: 8px;
				font-size: ${detailFontSize};
				color: ${disabledFontColor};
			}

			> li {
				padding: 4px;
			}
		`,
		lifecycleToken
	)
);

export interface CtrlTabProps {
	selectedDocument: DuplexDataSource<ProjectFile>;
	documents: ArrayDataSource<ProjectFile>;
}

export function CtrlTab(props: CtrlTabProps) {
	return (
		<ul class={style}>
			{props.documents.map((e) => {
				const itemClass = aurumClassName({
					highlight: props.selectedDocument.transform(dsMap((file) => file.diskPath === e.diskPath))
				});

				return (
					<li class={itemClass}>
						<span>{parse(e.projectPath.value).base}</span>
						<span class="hint">({e.projectPath})</span>
					</li>
				);
			})}
		</ul>
	);
}
