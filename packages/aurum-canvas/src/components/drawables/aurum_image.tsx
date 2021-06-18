import { AurumComponentAPI, DataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumRectangleProps extends Omit<CommonProps, 'strokeColor' | 'fillColor'> {
	width?: number | DataSource<number>;
	height?: number | DataSource<number>;
	src: string | DataSource<string>;
}

export interface ImageComponentModel extends ComponentModel {
	opacity?: number | DataSource<number>;
	width?: number | DataSource<number>;
	height?: number | DataSource<number>;
	src: string | DataSource<string>;
}

export function AurumRectangle(props: AurumRectangleProps, children: Renderable[], api: AurumComponentAPI): ImageComponentModel {
	const components = api.prerender(children).filter((c) => !!c);
	return {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.IMAGE
	};
}
