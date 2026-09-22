/** Small bounded cache. Live scene nodes can retain resources independently of this shared cache. */
export class LruCache<K, V> {
    private readonly entries = new Map<K, V>();

    constructor(private readonly capacity: number) {}

    public get(key: K): V | undefined {
        const value = this.entries.get(key);
        if (value !== undefined) {
            this.entries.delete(key);
            this.entries.set(key, value);
        }
        return value;
    }

    public set(key: K, value: V): void {
        this.entries.delete(key);
        this.entries.set(key, value);
        if (this.entries.size > this.capacity) {
            this.entries.delete(this.entries.keys().next().value);
        }
    }
}
