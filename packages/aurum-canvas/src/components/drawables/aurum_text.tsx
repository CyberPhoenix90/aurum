import { AurumComponentAPI, createLifeCycle, DataSource, dsUnique, ReadOnlyDataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumTexteProps extends CommonProps {
	font?: string | DataSource<string>;
	fontSize?: number | DataSource<number>;
	fontWeight?: string | DataSource<string>;
	width?: number | DataSource<number>;
	wrapWidth?: number | DataSource<number>;
	textBaseline?: string | DataSource<string>;
	lineHeight?: number | DataSource<number>;
}

export interface TextComponentModel extends ComponentModel {
	text: string | DataSource<string>;
	font?: string | DataSource<string>;
	textBaseline?: string | DataSource<string>;
	fontSize?: number | DataSource<number>;
	strokeColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	fontWeight?: string | DataSource<string>;
	fillColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	opacity?: number | DataSource<number>;
	wrapWidth?: number | DataSource<number>;
	lineHeight?: number | DataSource<number>;
}

export function AurumText(props: AurumTexteProps, children: Renderable[], api: AurumComponentAPI): TextComponentModel {
	const lc = createLifeCycle();
	api.synchronizeLifeCycle(lc);

	const content = api.prerender(children, lc).filter((c) => !!c);
	const text = new DataSource('');

	if (props.font instanceof DataSource) {
		props.font.listen(() => {
			if (result.renderedState) {
				result.renderedState.lines = [];
			}
		}, api.cancellationToken);
	}

	if (props.fontWeight instanceof DataSource) {
		props.fontWeight.listen(() => {
			if (result.renderedState) {
				result.renderedState.lines = [];
			}
		}, api.cancellationToken);
	}

	if (props.fontSize instanceof DataSource) {
		props.fontSize.listen(() => {
			if (result.renderedState) {
				result.renderedState.lines = [];
			}
		}, api.cancellationToken);
	}

	if (props.width instanceof DataSource) {
		props.width.listen(() => {
			if (result.renderedState) {
				result.renderedState.lines = [];
			}
		}, api.cancellationToken);
	}

	if (props.wrapWidth instanceof DataSource) {
		props.wrapWidth.listen(() => {
			if (result.renderedState) {
				result.renderedState.lines = [];
			}
		}, api.cancellationToken);
	}

	for (const i of content as Array<string | ReadOnlyDataSource<string>>) {
		if (i instanceof DataSource) {
			i.transform(dsUnique(), api.cancellationToken).listen((v) => {
				if (result.renderedState) {
					result.renderedState.lines = [];
				}
				updateText(text, content as any);
			});
		}
	}
	updateText(text, content as any);

	const result = {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		text,
		children: [],
		animations: [],
		type: ComponentType.TEXT
	};
	return result;
}

function updateText(text: DataSource<string>, content: Array<string | ReadOnlyDataSource<string>>) {
	text.update(
		content.reduce<string>((p, c) => {
			if (typeof c === 'string') {
				return `${p}${c}`;
			} else {
				if (c.value) {
					return `${p}${c.value}`;
				} else {
					return p;
				}
			}
		}, '')
	);
}
