import { ArrayDataSource, AurumComponentAPI, DataSource } from 'aurumjs';
import { Unit } from 'aurum-layout-engine';
import { CommonEntityProps } from '../../../models/entities.js';
import { Data } from '../../../models/input_data.js';
import { ResourceWrapper } from '../../../resources/abstract_resource_manager.js';
import { toSourceIfDefined } from '../../../utilities/data/to_source.js';
import { entityDefaults } from '../../entity_defaults.js';
import { normalizeComponents, propsToModel } from '../../shared.js';
import { SpriteGraphNode } from './api.js';
import { SpriteEntity } from './model.js';

export type Texture = Data<string | HTMLCanvasElement | HTMLImageElement | ResourceWrapper<HTMLImageElement, string>>;

export interface SpriteEntityProps extends CommonEntityProps {
    texture?: Texture;
    tint?: Data<string>;
    /**
     * Offset from the texture at which drawing begins
     */
    drawOffsetX?: Data<number>;
    drawOffsetY?: Data<number>;
    /**
     * with and height to draw starting at the source point
     */
    drawDistanceX?: Data<number | Unit>;
    drawDistanceY?: Data<number | Unit>;

    onAttach?(node: SpriteGraphNode): void;
    onDetach?(node: SpriteGraphNode): void;
    class?: SpriteEntity[] | ArrayDataSource<SpriteEntity>;
}

export function Sprite(props: SpriteEntityProps, _, api: AurumComponentAPI): SpriteGraphNode {
    return new SpriteGraphNode({
        name: props.name ?? SpriteGraphNode.name,
        components: normalizeComponents(props.components),
        cancellationToken: api.cancellationToken,
        children: undefined,
        models: {
            coreDefault: entityDefaults,
            appliedStyleClasses: props.class instanceof ArrayDataSource ? props.class : new ArrayDataSource(props.class),
            entityTypeDefault: spriteDefaultModel,
            userSpecified: {
                ...propsToModel(props),
                autoWidth: new DataSource(0),
                autoHeight: new DataSource(0),
                texture: toSourceIfDefined(props.texture),
                drawDistanceX: toSourceIfDefined(props.drawDistanceX),
                drawDistanceY: toSourceIfDefined(props.drawDistanceY),
                drawOffsetX: toSourceIfDefined(props.drawOffsetX),
                drawOffsetY: toSourceIfDefined(props.drawOffsetY),
                tint: toSourceIfDefined(props.tint)
            }
        },
        onAttach: props.onAttach,
        onDetach: props.onDetach
    });
}

export const spriteDefaultModel: SpriteEntity = {
    width: new DataSource('auto'),
    height: new DataSource('auto'),
    tint: new DataSource(undefined),
    drawDistanceX: new DataSource(undefined),
    drawDistanceY: new DataSource(undefined),
    drawOffsetX: new DataSource(undefined),
    drawOffsetY: new DataSource(undefined),
    texture: new DataSource(undefined)
};
