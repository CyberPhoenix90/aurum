import {
    ArrayDataSource,
    AurumComponentAPI,
    CancellationToken,
    createRenderSession,
    EventEmitter,
    GenericDataSource,
    ReadOnlyArrayDataSource,
    Renderable
} from 'aurumjs';
import { render } from './custom_aurum_renderer';
import { Constructor } from './query';

export const InjectionMapSymbol = Symbol('InjectionMap');

export function inject(dependency: Constructor<Trait>, optional: boolean = false): (target: any, propertyKey: string) => void {
    return function (target: any, propertyKey: string): void {
        if (!target[InjectionMapSymbol]) {
            target[InjectionMapSymbol] = new Map<string, { trait: Constructor<Trait>; optional: boolean }>();
        }

        target[InjectionMapSymbol].set(propertyKey, {
            trait: dependency,
            optional
        });
    };
}

export interface EntityModel {
    traits: Map<Constructor<Trait>, Trait>;
    uid: number;
    children: ReadOnlyArrayDataSource<EntityModel>;
    addChild(child: EntityModel): void;
    removeChild(child: EntityModel): void;
    prependChild(child: EntityModel): void;
    parent: EntityModel;
}

export function Entity(props: {}, children: Renderable[], api: AurumComponentAPI): EntityModel {
    const result = currentEntityPtr.entity;
    const tail = new ArrayDataSource<EntityModel>();
    //@ts-ignore
    children.push(tail);
    const head = new ArrayDataSource<EntityModel>();
    //@ts-ignore
    children.unshift(head);

    result.addChild = (child: EntityModel) => {
        tail.push(child);
    };

    result.removeChild = (child: EntityModel) => {
        if (tail.includes(child)) {
            tail.remove(child);
        } else {
            head.remove(child);
        }
    };

    result.prependChild = (child: EntityModel) => {
        child.parent = result;
        head.unshift(child);
    };

    const rs = createRenderSession();
    result.children = ArrayDataSource.fromMultipleSources(render(children, rs, false));

    result.children.onItemsAdded.subscribe((items) => {
        for (const item of items) {
            item.parent = result;
        }
        for (const ac of rs.attachCalls) {
            ac();
        }
        rs.attachCalls = [];
    }, api.cancellationToken);

    result.children.onItemsRemoved.subscribe((items) => {
        for (const item of items) {
            item.parent = undefined;
        }
    }, api.cancellationToken);

    api.onAttach(() => {
        for (const ac of rs.attachCalls) {
            ac();
        }
        rs.attachCalls = [];
    });

    api.onDetach(() => {
        rs.sessionToken.cancel();
    });

    return result;
}

export abstract class Trait {
    // In case you want to do something after the injection is done
    public setup(lifeCycleToken: CancellationToken): void {}
}

export abstract class Behavior<T = void> extends Trait {
    protected owner: EntityModel;
    protected triggers: Array<EventEmitter<T> | GenericDataSource<T>>;
    protected lifeCycleToken: CancellationToken;
    public enabled: boolean;

    public onAttach(owner: EntityModel): void {
        this.owner = owner;
        this.lifeCycleToken = new CancellationToken();
        for (const trigger of this.triggers) {
            if (trigger instanceof EventEmitter) {
                trigger.subscribe(this.onTryTrigger, this.lifeCycleToken);
            } else {
                trigger.listen(this.onTryTrigger, this.lifeCycleToken);
            }
        }
    }

    private onTryTrigger(event: T): void {
        if (this.enabled) {
            this.onTrigger(event);
        }
    }

    public onDetach(): void {
        this.lifeCycleToken.cancel();
        this.owner = undefined;
    }

    constructor(triggers: Array<EventEmitter<T> | GenericDataSource<T>>, enabled: boolean = true) {
        super();
        this.enabled = enabled;
        this.triggers = triggers;
    }

    public abstract onTrigger(data: T): void;
}

export let currentEntityPtr: {
    entity: EntityModel;
};
export function using(...traits: Array<Trait>): void {
    for (let trait of traits) {
        //@ts-ignore
        if (currentEntity.traits.has(trait.constructor)) {
            throw new Error(`Trait ${trait.constructor.name} already attached to entity ${currentEntityPtr.entity.constructor.name}`);
        }
        //@ts-ignore
        currentEntity.traits.set(trait.constructor, trait);
    }
}

export function finalizeEntity(entity: EntityModel, lifeCycleToken: CancellationToken): void {
    for (const trait of entity.traits.values()) {
        if (trait.constructor[InjectionMapSymbol]) {
            for (const key of trait.constructor[InjectionMapSymbol].keys()) {
                const dependency = trait.constructor[InjectionMapSymbol].get(key);
                const value = entity.traits.get(dependency.trait);
                if (value || dependency.optional) {
                    entity[key] = value;
                } else {
                    throw new Error(`Trait ${dependency.trait.name} not attached to entity ${entity.constructor.name}`);
                }
            }
        }

        trait.setup(lifeCycleToken);
    }
}
