import { DataSource, Renderable, AurumComponentAPI, createLifeCycle } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';
import { CommonProps } from '../common_props';

export interface AurumRegularPolygonProps extends CommonProps {
	sides: number | DataSource<number>;
	radius: number | DataSource<number>;
}

export interface RegularPolygonComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	fillColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	opacity?: number | DataSource<number>;
	sides?: number | DataSource<number>;
	radius?: number | DataSource<number>;
}

export function AurumRegularPolygon(props: AurumRegularPolygonProps, children: Renderable[], api: AurumComponentAPI): RegularPolygonComponentModel {
	const lc = createLifeCycle();
	api.synchronizeLifeCycle(lc);

	const components = api.prerender(children, lc).filter((c) => !!c);
	return {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.REGULAR_POLYGON
	};
}
