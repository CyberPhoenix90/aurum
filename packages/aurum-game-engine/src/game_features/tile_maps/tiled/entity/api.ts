import { SceneGraphNode, SceneGraphNodeModel } from '../../../../models/scene_graph';
import { TiledMapEntity, TiledMapRenderModel } from './model';
import { RenderableType } from '../../../../models/entities';
import { TiledMapTileModel } from '../tiled_map_format';
import { TiledLayer } from '../tiled_layer';
import { Tileset } from '../tileset';
import { layoutEngine } from '../../../../core/layout_engine';

export class TiledMapGraphNode extends SceneGraphNode<TiledMapEntity> {
    public declare readonly renderState: TiledMapRenderModel;

    constructor(config: SceneGraphNodeModel<TiledMapEntity>) {
        super(config);
    }

    protected createResolvedModel(): TiledMapEntity {
        const base = this.createBaseResolvedModel() as TiledMapEntity;

        base.resourceRootUrl = this.getModelSourceWithFallback('resourceRootUrl');
        base.tilesets = this.getModelSourceWithFallback('tilesets');
        base.mapObjects = this.getModelSourceWithFallback('mapObjects');
        base.layers = this.getModelSourceWithFallback('layers');
        base.mapData = this.getModelSourceWithFallback('mapData');
        base.entityFactory = this.getModelSourceWithFallback('entityFactory');

        return base;
    }

    protected createRenderModel(): TiledMapRenderModel {
        const { x, y, innerWidth, innerHeight } = layoutEngine.getLayoutDataFor(this);
        return {
            alpha: this.resolvedModel.alpha,
            rotation: this.resolvedModel.rotation,
            clip: this.resolvedModel.clip,
            renderableType: RenderableType.TILE_MAP,
            x: x,
            y: y,
            width: innerWidth,
            height: innerHeight,
            scaleX: this.resolvedModel.scaleX,
            scaleY: this.resolvedModel.scaleY,
            visible: this.resolvedModel.visible,
            zIndex: this.resolvedModel.zIndex,
            blendMode: this.resolvedModel.blendMode,
            shader: this.resolvedModel.shaders,
            layers: this.resolvedModel.layers,
            mapData: this.resolvedModel.mapData,
            tilesets: this.resolvedModel.tilesets
        };
    }

    public getTileMetaDataByGid(tileGid: number): TiledMapTileModel {
        if (tileGid === 0) {
            return undefined;
        }

        let tileset: Tileset | undefined = this.resolvedModel.tilesets.getData().find((t) => t.hasGid(tileGid));
        if (tileset === undefined) {
            throw new Error('something went wrong, hasGid = false for every tileset');
        }
        return tileset.getTileMetadata(tileGid);
    }

    public hasTile(layer: number, x: number, y: number): boolean {
        const selectedLayer: TiledLayer | undefined = this.resolvedModel.layers[layer];
        if (selectedLayer === undefined || !selectedLayer.hasData()) {
            return false;
        } else {
            return selectedLayer.hasTile(x, y);
        }
    }

    public getTileMetadata(layer: number, tileX: number, tileY: number): TiledMapTileModel {
        if (this.hasTile(layer, tileX, tileY)) {
            const selectedLayer: TiledLayer | undefined = this.resolvedModel.layers[layer];

            return this.getTileMetaDataByGid(selectedLayer.getTileData(tileX, tileY));
        } else {
            return undefined;
        }
    }
}
