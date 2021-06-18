import { DataSource, Renderable, AurumComponentAPI, createLifeCycle } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';
import { CommonProps } from '../common_props';

export interface AurumElipseProps extends CommonProps {
	rx: number | DataSource<number>;
	ry: number | DataSource<number>;
	startAngle?: number | DataSource<number>;
	endAngle?: number | DataSource<number>;
}

export interface ElipseComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	fillColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	opacity?: number | DataSource<number>;
	rx: number | DataSource<number>;
	ry: number | DataSource<number>;
	rotation?: number | DataSource<number>;
	startAngle?: number | DataSource<number>;
	endAngle?: number | DataSource<number>;
}

export function AurumElipse(props: AurumElipseProps, children: Renderable[], api: AurumComponentAPI): ElipseComponentModel {
	const lc = createLifeCycle();
	api.synchronizeLifeCycle(lc);

	const components = api.prerender(children, lc).filter((c) => !!c);
	return {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.ELIPSE
	};
}
