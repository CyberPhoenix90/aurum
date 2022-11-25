import { ReadOnlyDataSource, ArrayDataSource, DataSource } from 'aurumjs';
import { RenderableType, BlendModes, Shader } from '../models/entities.js';

export interface EntityRenderModel {
    renderableType: RenderableType;
    x: ReadOnlyDataSource<number>;
    y: ReadOnlyDataSource<number>;
    width: DataSource<number>;
    height: DataSource<number>;
    scaleX: DataSource<number>;
    scaleY: DataSource<number>;
    zIndex: ReadOnlyDataSource<number>;
    clip: ReadOnlyDataSource<boolean>;
    visible: ReadOnlyDataSource<boolean>;
    alpha: ReadOnlyDataSource<number>;
    rotation: ReadOnlyDataSource<number>;
    blendMode?: ReadOnlyDataSource<BlendModes>;
    shader: ArrayDataSource<Shader>;
}

export interface TextureEntityRenderModel extends EntityRenderModel {}
export interface NineSliceBoxSpriteEntityRenderModel extends EntityRenderModel {}
