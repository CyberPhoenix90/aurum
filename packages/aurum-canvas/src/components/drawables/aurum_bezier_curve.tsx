import { AurumComponentAPI, createLifeCycle, DataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumBezierCurveProps extends CommonProps {
	tx: number | DataSource<number>;
	ty: number | DataSource<number>;
	cx: number | DataSource<number>;
	cy: number | DataSource<number>;
	c2x: number | DataSource<number>;
	c2y: number | DataSource<number>;
	lineWidth?: number | DataSource<number>;
}

export interface BezierCurveComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	fillColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	opacity?: number | DataSource<number>;
	cx: number | DataSource<number>;
	cy: number | DataSource<number>;
	c2x: number | DataSource<number>;
	c2y: number | DataSource<number>;
	tx: number | DataSource<number>;
	ty: number | DataSource<number>;
	lineWidth?: number | DataSource<number>;
}

export function AurumBezierCurve(props: AurumBezierCurveProps, children: Renderable[], api: AurumComponentAPI): BezierCurveComponentModel {
	const lc = createLifeCycle();
	api.synchronizeLifeCycle(lc);

	const components = api.prerender(children, lc).filter((c) => !!c);
	return {
		...props,
		opacity: props.opacity ?? 1,
		lineWidth: props.lineWidth ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.BEZIER_CURVE
	};
}
