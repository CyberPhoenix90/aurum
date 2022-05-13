import { ArrayDataSource, CancellationToken } from 'aurumjs';
import { EntityModel } from './entity';

export function registerEntity(entity: EntityModel): void {}

export const entities: ArrayDataSource<EntityModel> = new ArrayDataSource();
export const entitiesByTrait = entities.groupByMultiProvider((item) => Array.from(item.traits.keys()));
export const entitiesByTraitByTrait = entitiesByTrait.map(
    (key, item) => item.groupByMultiProvider((item) => Array.from(item.traits.keys())),
    CancellationToken.forever
);
