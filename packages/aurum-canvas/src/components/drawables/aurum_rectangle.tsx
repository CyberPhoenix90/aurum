import { AurumComponentAPI, createLifeCycle, DataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumRectangleProps extends CommonProps {
	width: number | DataSource<number>;
	height: number | DataSource<number>;
}

export interface RectangleComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	fillColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	opacity?: number | DataSource<number>;
	width: number | DataSource<number>;
	height: number | DataSource<number>;
}

export function AurumRectangle(props: AurumRectangleProps, children: Renderable[], api: AurumComponentAPI): RectangleComponentModel {
	const lc = createLifeCycle();
	api.synchronizeLifeCycle(lc);

	const components = api.prerender(children, lc).filter((c) => !!c);
	return {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.RECTANGLE
	};
}
