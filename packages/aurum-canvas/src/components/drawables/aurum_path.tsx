import { DataSource, Renderable, AurumComponentAPI, createLifeCycle } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';
import { CommonProps } from '../common_props';

export interface AurumPathProps extends CommonProps {
	path: string | DataSource<string>;
	lineWidth?: number | DataSource<number>;
}

export interface PathComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	fillColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	opacity?: number | DataSource<number>;
	path?: string | DataSource<string>;
	lineWidth?: number | DataSource<number>;
}

export function AurumPath(props: AurumPathProps, children: Renderable[], api: AurumComponentAPI): PathComponentModel {
	const lc = createLifeCycle();
	api.synchronizeLifeCycle(lc);

	const components = api.prerender(children, lc).filter((c) => !!c);
	return {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.PATH
	};
}
