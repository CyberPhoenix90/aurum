import { EntityRenderModel } from '../../../rendering/model.js';
import { CommonEntity } from '../../../models/entities.js';
import { ArrayDataSource } from 'aurumjs';

export interface ContainerEntity extends CommonEntity {
    class?: ContainerEntity[] | ArrayDataSource<ContainerEntity>;
}

export interface ContainerEntityRenderModel extends EntityRenderModel {}
