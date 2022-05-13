/**
 * Array that is made out of other arrays without having to concat or synchronize
 */
export class VirtualUnionArray<T> {
    public sources: T[][];

    constructor(sources: T[][] = []) {
        this.sources = sources;
    }

    public get length(): number {
        return this.sources.reduce((p, c) => p + c.length, 0);
    }

    public get(index: number): T {
        if (this.sources.length === 0) {
            return undefined;
        }

        let ptr = 0;
        while (true) {
            if (index < this.sources[ptr].length) {
                return this.sources[ptr][index];
            } else {
                index -= this.sources[ptr].length;
                ptr++;
            }
            if (ptr >= this.sources.length) {
                return undefined;
            }
        }
    }

    *[Symbol.iterator]() {
        let i = 0;
        while (i < this.length) {
            yield this.get(i);
            i++;
        }
    }
}
