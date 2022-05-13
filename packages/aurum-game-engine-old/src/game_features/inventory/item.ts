export interface StackData {
	stackId: string;
	stackSize: number;
	stackCapacity: number;
}

export interface ItemModel {
	name: string;
	stackData?: StackData;
}

export abstract class AbstractItem {
	public readonly name: string;
	public readonly stackData: StackData;

	public get stackSize() {
		if (this.isStackable()) {
			return this.stackData.stackSize;
		} else {
			return 0;
		}
	}

	public set stackSize(value: number) {
		if (this.isStackable()) {
			this.stackData.stackSize = value;
		} else {
			throw new Error('item is not stackable');
		}
	}

	public get stackCapacity(): number {
		if (this.isStackable()) {
			return this.stackData.stackCapacity;
		} else {
			return 0;
		}
	}

	constructor(model: ItemModel) {
		this.name = model.name;
		this.stackData = model.stackData;
	}

	public isStackable(): boolean {
		return this.stackData !== undefined;
	}

	public isStackFull(): boolean {
		if (!this.isStackable()) {
			return true;
		} else {
			return this.stackData.stackSize >= this.stackData.stackCapacity;
		}
	}

	public getRemainingStackSize(): number {
		if (this.isStackFull()) {
			return 0;
		} else {
			return this.stackData.stackCapacity - this.stackData.stackSize;
		}
	}
}
