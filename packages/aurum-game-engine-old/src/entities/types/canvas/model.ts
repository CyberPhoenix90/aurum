import { PaintOperation } from './canvas_entity';
import { ArrayDataSource } from 'aurumjs';
import { EntityRenderModel } from '../../../rendering/model';
import { CommonEntity } from '../../../models/entities';

export interface CanvasEntity extends CommonEntity {
	paintOperations?: ArrayDataSource<PaintOperation>;
	class?: CanvasEntity[] | ArrayDataSource<CanvasEntity>;
}

export interface CanvasEntityRenderModel extends EntityRenderModel {
	paintOperations: ArrayDataSource<PaintOperation>;
}
