import { ArrayDataSource, MapDataSource, DataSource } from 'aurumjs';
import { Constructor } from '../models/common';
import { AbstractComponent } from './components/abstract_component';
import { CommonEntityProps, CommonEntity } from '../models/entities';
import { toSourceIfDefined } from '../utilities/data/to_source';

export function getComponentByTypeFactory(components: ArrayDataSource<AbstractComponent>): (type: any) => any {
	return (type: Constructor<any>) => {
		return components.getData().find((c) => Object.getPrototypeOf(c).constructor === type);
	};
}

export function propsToModel(props: CommonEntityProps): CommonEntity {
	return {
		layout: toSourceIfDefined(props.layout),
		x: toSourceIfDefined(props.x) ?? new DataSource(0),
		y: toSourceIfDefined(props.y) ?? new DataSource(0),
		originX: toSourceIfDefined(props.originX),
		originY: toSourceIfDefined(props.originY),
		height: toSourceIfDefined(props.height),
		width: toSourceIfDefined(props.width),
		scaleX: toSourceIfDefined(props.scaleX),
		scaleY: toSourceIfDefined(props.scaleY),
		alpha: toSourceIfDefined(props.alpha),
		rotation: toSourceIfDefined(props.rotation),
		clip: toSourceIfDefined(props.clip),
		shaders: props.shaders ? (props.shaders instanceof ArrayDataSource ? props.shaders : new ArrayDataSource(props.shaders)) : new ArrayDataSource([]),
		ignoreLayout: toSourceIfDefined(props.ignoreLayout),
		spreadLayout: toSourceIfDefined(props.spreadLayout),
		visible: toSourceIfDefined(props.visible),
		blendMode: toSourceIfDefined(props.blendMode),
		zIndex: toSourceIfDefined(props.zIndex)
	};
}

export function normalizeComponents(
	components: MapDataSource<Constructor<AbstractComponent>, AbstractComponent> | AbstractComponent[]
): MapDataSource<Constructor<AbstractComponent>, AbstractComponent> {
	return components
		? components instanceof MapDataSource
			? components
			: new MapDataSource(new Map(components.filter((e) => !!e).map((v) => [Object.getPrototypeOf(v).constructor, v])))
		: new MapDataSource(new Map());
}
