import { PaintOperation } from './canvas_entity.js';
import { ArrayDataSource } from 'aurumjs';
import { EntityRenderModel } from '../../../rendering/model.js';
import { CommonEntity } from '../../../models/entities.js';

export interface CanvasEntity extends CommonEntity {
    paintOperations?: ArrayDataSource<PaintOperation>;
    class?: CanvasEntity[] | ArrayDataSource<CanvasEntity>;
}

export interface CanvasEntityRenderModel extends EntityRenderModel {
    paintOperations: ArrayDataSource<PaintOperation>;
}
