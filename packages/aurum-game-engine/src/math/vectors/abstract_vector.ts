export abstract class AbstractVector {
    protected memory: number[];

    public get dimensions(): number {
        return this.memory.length;
    }

    constructor(memory: number[]) {
        this.memory = memory;
    }

    public flip(): this {
        return this.mul(-1);
    }

    public inverse(): this {
        for (let i = 0; i < this.memory.length; i++) {
            this.memory[i] = 1 / this.memory[i];
        }

        return this;
    }

    public randomize(min: number, max: number, integer = false): this {
        for (let i: number = 0; i < this.memory.length; i++) {
            this.memory[i] = Math.random() * (max - min) + min;
        }
        if (integer) {
            this.floor();
        }
        return this;
    }

    public addScalar(scalar: number): this {
        for (let i: number = 0; i < this.memory.length; i++) {
            this.memory[i] += scalar;
        }

        return this;
    }

    public subScalar(scalar: number): this {
        for (let i: number = 0; i < this.memory.length; i++) {
            this.memory[i] -= scalar;
        }

        return this;
    }

    public mul(scalar: number): this {
        for (let i: number = 0; i < this.memory.length; i++) {
            this.memory[i] *= scalar;
        }

        return this;
    }

    public sign(): this {
        for (let i: number = 0; i < this.memory.length; i++) {
            this.memory[i] = Math.sign(this.memory[i]);
        }

        return this;
    }

    public div(scalar: number): this {
        for (let i = 0; i < this.memory.length; i++) {
            this.memory[i] /= scalar;
        }

        return this;
    }

    public floor(): this {
        for (let i = 0; i < this.memory.length; i++) {
            this.memory[i] = Math.floor(this.memory[i]);
        }

        return this;
    }

    public round(): this {
        for (let i = 0; i < this.memory.length; i++) {
            this.memory[i] = Math.round(this.memory[i]);
        }

        return this;
    }

    public ceil(): this {
        for (let i = 0; i < this.memory.length; i++) {
            this.memory[i] = Math.ceil(this.memory[i]);
        }

        return this;
    }

    public abs(): this {
        for (let i = 0; i < this.memory.length; i++) {
            this.memory[i] = Math.abs(this.memory[i]);
        }

        return this;
    }

    public setAll(value: number): this {
        for (let i = 0; i < this.memory.length; i++) {
            this.memory[i] = value;
        }

        return this;
    }

    public zero(): this {
        return this.setAll(0);
    }

    public map(cb: (component: number, index?: number) => number): this {
        for (let i = 0; i < this.memory.length; i++) {
            this.memory[i] = cb(this.memory[i], i);
        }

        return this;
    }

    public min(): number {
        return Math.min.apply(Math, this.memory);
    }

    public max(): number {
        return Math.max.apply(Math, this.memory);
    }

    public arithmeticAverage(): number {
        return this.memory.reduce((a, b) => a + b) / this.memory.length;
    }

    public geometricAverage(): number {
        return this.memory.reduce((a, b) => a * b) ** (1 / this.memory.length);
    }

    public modulo(num: number): this {
        for (let i: number = 0; i < this.memory.length; i++) {
            this.memory[i] = this.memory[i] % num;
        }

        return this;
    }

    public clamp(min: number, max: number): this {
        for (let i: number = 0; i < this.memory.length; i++) {
            this.memory[i] = Math.max(Math.min(this.memory[i], max), min);
        }

        return this;
    }

    /**
     * Returns the number of steps it would take to walk the vector if you can't walk diagonally
     */
    public manhattanLength(): number {
        return this.memory.reduce((a, b) => a + b);
    }

    /**
     * Returns the absolute length squared of the vector, good for approximative lengths, avoids expensive square root computation
     * @returns {number}
     */
    public lengthSquared(): number {
        let total: number = 0;
        for (let i: number = 0; i < this.memory.length; i++) {
            const v = this.memory[i];
            total += v * v;
        }

        return total;
    }
}
