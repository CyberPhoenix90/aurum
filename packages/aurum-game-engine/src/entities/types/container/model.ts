import { EntityRenderModel } from '../../../rendering/model';
import { CommonEntity } from '../../../models/entities';
import { ArrayDataSource } from 'aurumjs';

export interface ContainerEntity extends CommonEntity {
	class?: ContainerEntity[] | ArrayDataSource<ContainerEntity>;
}

export interface ContainerEntityRenderModel extends EntityRenderModel {}
