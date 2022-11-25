import { ArrayDataSource, CancellationToken, MapDataSource } from 'aurumjs';
import { Constructor } from '../../../models/common.js';
import { SceneGraphNode, ContainerGraphNode } from '../../../models/scene_graph.js';
import { AbstractComponent } from '../../components/abstract_component.js';
import { ContainerEntity } from './model.js';
import { CommonEntity } from '../../../models/entities.js';
import { Data } from '../../../models/input_data.js';

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
