import { ArrayDataSource, DataSource, MapDataSource } from 'aurumjs';
import { AbstractComponent } from '../entities/components/abstract_component';
import { Constructor, MapLike } from '../models/common';
import { AbstractLayout, Position, Size } from 'aurum-layout-engine';
import { Data } from '../models/input_data';
import { SceneGraphNode } from './scene_graph';

export interface Shader {
    vertex?: string;
    fragment?: string;
    uniforms?: ShaderUniforms;
}

export type ShaderUniforms = MapLike<boolean | number | number[]>;

export interface CommonEntityProps {
    x?: Data<Position>;
    y?: Data<Position>;
    originX?: Data<number>;
    originY?: Data<number>;
    clip?: Data<boolean>;
    ignoreLayout?: Data<boolean>;
    spreadLayout?: Data<boolean>;
    wrapperNode?: Data<boolean>;
    zIndex?: Data<number>;
    shaders?: Shader[] | ArrayDataSource<Shader>;
    blendMode?: Data<BlendModes>;
    width?: Data<Size>;
    height?: Data<Size>;
    scaleX?: Data<number>;
    scaleY?: Data<number>;
    visible?: Data<boolean>;
    alpha?: Data<number>;
    rotation?: Data<number>;
    components?: MapDataSource<Constructor<AbstractComponent>, AbstractComponent> | AbstractComponent[];
    class?: CommonEntity[] | ArrayDataSource<CommonEntity>;
    name?: Data<string>;
    layout?: AbstractLayout | DataSource<AbstractLayout>;
    onAttach?(node: SceneGraphNode<CommonEntity>): void;
    onDetach?(node: SceneGraphNode<CommonEntity>): void;
}

export interface CommonEntity {
    x?: DataSource<Position>;
    y?: DataSource<Position>;
    originX?: DataSource<number>;
    originY?: DataSource<number>;
    clip?: DataSource<boolean>;
    layout?: DataSource<AbstractLayout>;
    ignoreLayout?: DataSource<boolean>;
    spreadLayout?: DataSource<boolean>;
    wrapperNode?: DataSource<boolean>;
    zIndex?: DataSource<number>;
    scaleX?: DataSource<number>;
    scaleY?: DataSource<number>;
    shaders?: ArrayDataSource<Shader>;
    blendMode?: DataSource<BlendModes>;
    width?: DataSource<Size>;
    height?: DataSource<Size>;
    visible?: DataSource<boolean>;
    alpha?: DataSource<number>;
    rotation?: DataSource<number>;
}

export enum RenderableType {
    NO_RENDER,
    SPRITE,
    BOX_SPRITE,
    LABEL,
    CAMERA,
    CANVAS,
    TILE_MAP,
    TILED_SPRITE
}

export enum BlendModes {
    NORMAL,
    ADD,
    SUB,
    MULTIPLY
}
