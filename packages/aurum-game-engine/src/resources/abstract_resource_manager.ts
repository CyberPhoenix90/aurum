interface PreloadCOnfig {
	concurrent: boolean;
	onProgress?: (loaded: number, toLoad: number) => void;
	filter?: (id?: string) => boolean;
}

export abstract class AbstractResourceManager<T, D> {
	protected resourceMap: Map<string, ResourceWrapper<T, D>>;

	constructor() {
		this.resourceMap = new Map();
	}

	public getResourceById(id: string): ResourceWrapper<T, D> {
		return this.resourceMap.get(id);
	}

	public register(id: string, url: D): ResourceWrapper<T, D> {
		const wrapper: ResourceWrapper<T, D> = {
			isLoaded: false,
			load: () => this.preload(id).then((s) => s.resource),
			url,
			resource: undefined
		};

		this.resourceMap.set(id, wrapper);

		return wrapper;
	}

	public abstract preload(id: string): Promise<ResourceWrapper<T, D>>;

	public async preloadAll({ concurrent, onProgress, filter }: PreloadCOnfig): Promise<void> {
		const promises = [];
		let count = 0;
		let loaded = 0;
		for (const resource of this.resourceMap.keys()) {
			if (!filter || (filter(resource) && !this.resourceMap.get(resource).isLoaded)) {
				count++;
			}
		}
		onProgress(0, count);
		for (const resource of this.resourceMap.keys()) {
			if (!filter || filter(resource)) {
				if (concurrent) {
					promises.push(
						this.preload(resource).then((c) => {
							onProgress(++loaded, count);
							return c;
						})
					);
				} else {
					await this.preload(resource);
					onProgress(++loaded, count);
				}
			}
		}

		await Promise.all(promises);
	}
}

export interface ResourceWrapper<T, D> {
	url: D;
	isLoaded: boolean;
	resource?: T;
	load(): Promise<T>;
}
