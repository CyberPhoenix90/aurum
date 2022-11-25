import { CommonEntity } from '../../../models/entities.js';
import { DataSource, ArrayDataSource } from 'aurumjs';
import { ReadOnlyDataSource } from 'aurumjs';
import { EntityRenderModel } from '../../../rendering/model.js';

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
