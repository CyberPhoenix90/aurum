import { CommonEntity } from '../../../models/entities';
import { DataSource, ArrayDataSource } from 'aurumjs';
import { ReadOnlyDataSource } from 'aurumjs';
import { EntityRenderModel } from '../../../rendering/model';

export interface CameraEntity extends CommonEntity {
	resolutionX?: DataSource<number>;
	resolutionY?: DataSource<number>;
	backgroundColor?: DataSource<string>;
	class?: CameraEntity[] | ArrayDataSource<CameraEntity>;
}

export interface CameraEntityRenderModel extends EntityRenderModel {
	view: HTMLElement;
	backgroundColor: ReadOnlyDataSource<string>;
}
