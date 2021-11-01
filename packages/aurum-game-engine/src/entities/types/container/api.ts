import { ArrayDataSource, CancellationToken, MapDataSource } from 'aurumjs';
import { Constructor } from '../../../models/common';
import { SceneGraphNode, ContainerGraphNode } from '../../../models/scene_graph';
import { AbstractComponent } from '../../components/abstract_component';
import { ContainerEntity } from './model';
import { CommonEntity } from '../../../models/entities';
import { Data } from '../../../models/input_data';

export interface ContainerGraphNodeModel {
    name: Data<string>;
    cancellationToken: CancellationToken;
    components: MapDataSource<Constructor<AbstractComponent>, AbstractComponent>;
    children?: ArrayDataSource<SceneGraphNode<any>>;
    models: {
        coreDefault: CommonEntity;
        entityTypeDefault: ContainerEntity;
        appliedStyleClasses: ArrayDataSource<ContainerEntity>;
        userSpecified: ContainerEntity;
    };
    onAttach?(node: ContainerGraphNode): void;
    onDetach?(node: ContainerGraphNode): void;
}
