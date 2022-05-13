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
    const leftMargin =
        props.marginLeft ?? props.margin
            ? DataSource.fromAggregation([toSourceIfDefined(props.marginLeft), toSourceIfDefined(props.margin)], (l, s) => {
                  return l ?? s;
              })
            : undefined;

    const rightMargin =
        props.marginRight ?? props.margin
            ? DataSource.fromAggregation([toSourceIfDefined(props.marginRight), toSourceIfDefined(props.margin)], (r, s) => {
                  return r ?? s;
              })
            : undefined;

    const topMargin =
        props.marginTop ?? props.margin
            ? DataSource.fromAggregation([toSourceIfDefined(props.marginTop), toSourceIfDefined(props.margin)], (t, s) => {
                  return t ?? s;
              })
            : undefined;

    const bottomMargin =
        props.marginBottom ?? props.margin
            ? DataSource.fromAggregation([toSourceIfDefined(props.marginBottom), toSourceIfDefined(props.margin)], (b, s) => {
                  return b ?? s;
              })
            : undefined;

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
        wrapperNode: toSourceIfDefined(props.wrapperNode),
        visible: toSourceIfDefined(props.visible),
        blendMode: toSourceIfDefined(props.blendMode),
        zIndex: toSourceIfDefined(props.zIndex),
        marginBottom: bottomMargin,
        marginLeft: leftMargin,
        marginRight: rightMargin,
        marginTop: topMargin
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
