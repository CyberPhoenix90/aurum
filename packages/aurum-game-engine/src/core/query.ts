import { CancellationToken, ReadOnlyArrayDataSource } from 'aurumjs';
import { BoundingBox2D } from '../builtins/traits/bounding_box2D';
import { Position2D } from '../builtins/traits/position2d';
import { entitiesByTrait, entitiesByTraitByTrait } from './database';
import { EntityModel, Trait } from './entity';

export type Constructor<T> = new (...args: any[]) => T;

export function getAllWith(...classes: Constructor<Trait>[]): EntityModel[] {
    if (classes.length === 0) {
        throw new Error('No classes provided');
    }

    if (classes.length === 1) {
        return entitiesByTrait.get(classes[0]).toArray();
    }

    if (classes.length === 2) {
        return entitiesByTraitByTrait.get(classes[0]).get(classes[1]).toArray();
    } else {
        return entitiesByTraitByTrait
            .get(classes[0])
            .get(classes[1])
            .getData()
            .filter((item) => {
                for (let i = 2; i < classes.length; i++) {
                    if (!item.traits.has(classes[i])) {
                        return false;
                    }
                }

                return true;
            });
    }
}

export function getAllWithLive(cancellationToken: CancellationToken, ...classes: Constructor<Trait>[]): ReadOnlyArrayDataSource<EntityModel> {
    if (classes.length === 0) {
        throw new Error('No classes provided');
    }

    if (classes.length === 1) {
        return entitiesByTrait.get(classes[0]);
    }

    if (classes.length === 2) {
        return entitiesByTraitByTrait.get(classes[0]).get(classes[1]);
    } else {
        return entitiesByTraitByTrait
            .get(classes[0])
            .get(classes[1])
            .filter(
                (item) => {
                    for (let i = 2; i < classes.length; i++) {
                        if (!item.traits.has(classes[i])) {
                            return false;
                        }
                    }

                    return true;
                },
                [],
                cancellationToken
            );
    }
}

getAllWith(Position2D, BoundingBox2D);
