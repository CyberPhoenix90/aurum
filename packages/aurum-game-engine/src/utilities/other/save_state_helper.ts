import { DataSource, ArrayDataSource, DuplexDataSource } from 'aurumjs';

export type Serializable = string | string[] | number | number[] | { [key: string]: Serializable };

class SaveStateHelper {
	private streams: { [key: string]: DataSource<Serializable> | ArrayDataSource<Serializable> | DuplexDataSource<Serializable> };

	constructor() {
		this.streams = {};
	}

	private serializeState(): string {
		const data = {};
		for (const key in this.streams) {
			const stream = this.streams[key];
			if (stream instanceof ArrayDataSource) {
				data[key] = stream.toArray();
			} else {
				data[key] = stream.value;
			}
		}

		return JSON.stringify(data);
	}

	public registerDataSource(uuid: string | number, source: DataSource<Serializable> | ArrayDataSource<Serializable> | DuplexDataSource<Serializable>): void {
		if (uuid in this.streams) {
			throw new Error(`Duplicate stream uuid ${uuid}`);
		}
		this.streams[uuid] = source;
	}

	public saveState(key: string): void {
		localStorage.setItem(key, this.serializeState());
	}

	public saveStateAs(): string {
		return this.serializeState();
	}

	public loadFrom(data: string): void {
		this.load(data);
	}

	public hasState(key: string): boolean {
		return key in localStorage;
	}

	public loadState(key: string): boolean {
		const item = localStorage.getItem(key);
		if (item) {
			this.load(item);

			return true;
		} else {
			return false;
		}
	}

	private load(item: string): void {
		const data = JSON.parse(item);
		for (const key in data) {
			if (key in this.streams) {
				const stream = this.streams[key];
				if (stream instanceof ArrayDataSource) {
					stream.merge(data[key]);
				} else if (stream instanceof DataSource) {
					stream.update(data[key]);
				} else if (stream instanceof DuplexDataSource) {
					stream.updateUpstream(data[key]);
				}
			}
		}
	}
}

export const saveStateHelper = new SaveStateHelper();
