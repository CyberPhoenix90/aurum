import { ArrayDataSource, DataSource, EventEmitter } from 'aurumjs';
import { Data } from '../../models/input_data.js';
import { toSourceIfDefined } from '../../utilities/data/to_source.js';
import { AbstractItem } from './item.js';

export interface InventoryConfig {
    capacity: Data<number>;
    items?: ArrayDataSource<AbstractItem>;
}

export class Inventory {
    public readonly capacity: DataSource<number>;
    public readonly items: ArrayDataSource<AbstractItem>;

    public onItemStackUpdated: EventEmitter<AbstractItem>;

    constructor(options: InventoryConfig) {
        this.capacity = toSourceIfDefined(options.capacity);
        this.items = options.items ?? new ArrayDataSource();
    }

    public canAdd(item: AbstractItem): boolean {
        if (!item.isStackable()) {
            return !this.isFull();
        } else {
            const stackPartner: AbstractItem = this.getStackPartner(item);
            if (stackPartner !== undefined) {
                return true;
            } else {
                return !this.isFull();
            }
        }
    }

    public removeItem(item: AbstractItem): boolean {
        const index = this.items.indexOf(item);
        if (index === -1) {
            return false;
        } else {
            this.items.set(index, undefined);
            return true;
        }
    }

    public usedCapacity(): number {
        return this.items.getData().filter((e) => e).length;
    }

    public isFull(): boolean {
        return this.usedCapacity() >= this.capacity.value;
    }

    public addItem(item: AbstractItem): void {
        if (!this.canAdd(item)) {
            throw new Error('Inventory overflow');
        }

        if (item.isStackable()) {
            while (true) {
                const partner: AbstractItem = this.getStackPartner(item);

                if (partner === undefined) {
                    this.insertItem(item);
                    break;
                }

                const size: number = partner.getRemainingStackSize();
                if (size >= item.stackSize) {
                    partner.stackSize += item.stackSize;
                    this.onItemStackUpdated.fire(partner);
                    break;
                } else {
                    partner.stackSize += size;
                    item.stackSize -= size;
                    this.onItemStackUpdated.fire(partner);
                }
            }
        } else {
            this.insertItem(item);
        }
    }

    private insertItem(item: AbstractItem) {
        for (let i = 0; i < this.capacity.value; i++) {
            if (!this.items[i]) {
                this.items.set(i, item);
                return;
            }
        }
        throw new Error('insert called but no space available');
    }

    private getStackPartner(item: AbstractItem): AbstractItem {
        if (item.stackData) {
            return this.items.getData().find((i) => i && i.stackData && i.stackData.stackId === item.stackData.stackId && !i.isStackFull());
        }

        return undefined;
    }
}
