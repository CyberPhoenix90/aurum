export class ReflowWorkList<T> {
    private iterating: boolean;
    private currentIterationIndex: number;

    private workItems: T[] = [];

    public push(work: T) {
        const index = this.workItems.indexOf(work);
        if (index !== -1) {
            if (this.iterating && index < this.currentIterationIndex) {
                throw new Error(`A node that was already processed was marked as changed. This is either a bug or a hack that could lead to an infinite loop`);
            } else {
                //reflow work list does not do duplicates. In case a node is marked as changed from multiple sources it is moved to the back to ensure that it does not need to be recomputed twice
                for (let i = index; i < this.workItems.length - 1; i++) {
                    let a = this.workItems[i];
                    let b = this.workItems[i + 1];
                    this.workItems[i + 1] = a;
                    this.workItems[i] = b;
                }
            }
        } else {
            this.workItems.push(work);
        }
    }

    public clear() {
        this.workItems.length = 0;
    }

    *[Symbol.iterator](): IterableIterator<T> {
        if (this.iterating) {
            throw new Error(`Reflow work list cannot be iterated over multiple times at once`);
        }
        this.iterating = true;
        for (this.currentIterationIndex = 0; this.currentIterationIndex < this.workItems.length; this.currentIterationIndex++) {
            yield this.workItems[this.currentIterationIndex];
        }
        this.iterating = false;
        return;
    }
}
