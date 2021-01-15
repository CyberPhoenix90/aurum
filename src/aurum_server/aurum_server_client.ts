import { CancellationToken } from '../aurumjs';
import { ArrayDataSource, CollectionChange, DataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';

export enum RemoteProtocol {
	HEARTBEAT,
	LISTEN_DATASOURCE_ERR,
	LISTEN_DATASOURCE,
	LISTEN_DUPLEX_DATASOURCE_ERR,
	LISTEN_DUPLEX_DATASOURCE,
	LISTEN_ARRAY_DATASOURCE,
	LISTEN_ARRAY_DATASOURCE_ERR,
	CANCEL_DATASOURCE,
	UPDATE_DATASOURCE,
	UPDATE_DUPLEX_DATASOURCE,
	UPDATE_ARRAY_DATASOURCE,
	UPDATE_DUPLEX_DATASOURCE_ERR,
	CANCEL_ARRAY_DATASOURCE,
	CANCEL_DUPLEX_DATASOURCE
}

export interface AurumServerInfo {
	protocol?: 'wss' | 'ws';
	host?: string;
	id: string;
	authenticationToken?: string;
}

export async function syncDataSource(source: DataSource<any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
	const key = `${aurumServerInfo.protocol}${aurumServerInfo.host ?? location.host}`;
	await ensureConnection(key, aurumServerInfo);
	connections.get(key).syncDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

export async function syncArrayDataSource(source: ArrayDataSource<any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
	const key = `${aurumServerInfo.protocol}${aurumServerInfo.host ?? location.host}`;
	await ensureConnection(key, aurumServerInfo);
	connections.get(key).syncArrayDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

export async function syncDuplexDataSource(source: DuplexDataSource<any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
	const key = `${aurumServerInfo.protocol}${aurumServerInfo.host ?? location.host}`;
	await ensureConnection(key, aurumServerInfo);
	connections.get(key).syncDuplexDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

const connections: Map<string, AurumServerClient> = new Map();

class AurumServerClient {
	private readonly connection: WebSocket;
	private synchedDataSources: Map<string, DataSource<any>[]>;
	private synchedDuplexDataSources: Map<string, DuplexDataSource<any>[]>;
	private synchedArrayDataSources: Map<string, ArrayDataSource<any>[]>;

	private constructor(connection: WebSocket) {
		this.connection = connection;
		this.synchedDataSources = new Map();
		this.synchedDuplexDataSources = new Map();
		this.synchedArrayDataSources = new Map();
	}

	public syncDataSource(dataSource: DataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
		cancellation.addCancelable(() => {
			const listeners = this.synchedDataSources.get(id);
			listeners.splice(listeners.indexOf(dataSource));
			if (listeners.length === 0) {
				this.connection.send(
					JSON.stringify({
						type: RemoteProtocol.CANCEL_DATASOURCE,
						id,
						token: authenticationToken
					})
				);
			}
		});

		if (!this.synchedDataSources.has(id)) {
			this.connection.send(
				JSON.stringify({
					type: RemoteProtocol.LISTEN_DATASOURCE,
					id,
					token: authenticationToken
				})
			);
			this.synchedDataSources.set(id, [dataSource]);
		} else {
			this.synchedDataSources.get(id).push(dataSource);
		}
	}

	public syncArrayDataSource(dataSource: ArrayDataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
		cancellation.addCancelable(() => {
			const listeners = this.synchedArrayDataSources.get(id);
			listeners.splice(listeners.indexOf(dataSource));
			if (listeners.length === 0) {
				this.connection.send(
					JSON.stringify({
						type: RemoteProtocol.CANCEL_ARRAY_DATASOURCE,
						id,
						token: authenticationToken
					})
				);
			}
		});

		if (!this.synchedArrayDataSources.has(id)) {
			this.connection.send(
				JSON.stringify({
					type: RemoteProtocol.LISTEN_ARRAY_DATASOURCE,
					id,
					token: authenticationToken
				})
			);
			this.synchedArrayDataSources.set(id, [dataSource]);
		} else {
			this.synchedArrayDataSources.get(id).push(dataSource);
		}
	}

	public syncDuplexDataSource(dataSource: DuplexDataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
		cancellation.addCancelable(() => {
			const listeners = this.synchedDuplexDataSources.get(id);
			listeners.splice(listeners.indexOf(dataSource));
			if (listeners.length === 0) {
				this.connection.send(
					JSON.stringify({
						type: RemoteProtocol.CANCEL_DUPLEX_DATASOURCE,
						id,
						token: authenticationToken
					})
				);
			}
		});

		dataSource.listenUpstream((v) => {
			this.connection.send(
				JSON.stringify({
					type: RemoteProtocol.UPDATE_DUPLEX_DATASOURCE,
					token: authenticationToken,
					value: v,
					id
				})
			);
		});

		if (!this.synchedDataSources.has(id)) {
			this.connection.send(
				JSON.stringify({
					type: RemoteProtocol.LISTEN_DUPLEX_DATASOURCE,
					id,
					token: authenticationToken
				})
			);
			this.synchedDuplexDataSources.set(id, [dataSource]);
		} else {
			this.synchedDuplexDataSources.get(id).push(dataSource);
		}
	}

	public static connect(host: string, protocol?: 'ws' | 'wss'): Promise<AurumServerClient> {
		return new Promise((resolve, reject) => {
			if (!protocol) {
				if (typeof location === 'undefined') {
					throw new Error('Protocol is not optional in non browser environments');
				}
				if (location.protocol.startsWith('https')) {
					protocol = 'wss';
				} else {
					protocol = 'ws';
				}
			}
			const connection = new WebSocket(`${protocol}://${host}`);
			const client = new AurumServerClient(connection);

			connection.addEventListener('message', (m) => {
				try {
					const msg = JSON.parse(m.data);
					switch (msg.type) {
						case RemoteProtocol.UPDATE_DATASOURCE:
							if (client.synchedDataSources.has(msg.id)) {
								const dss = client.synchedDataSources.get(msg.id);
								for (const ds of dss) {
									ds.update(msg.value);
								}
							}
							break;
						case RemoteProtocol.UPDATE_ARRAY_DATASOURCE:
							if (client.synchedArrayDataSources.has(msg.id)) {
								const dss = client.synchedArrayDataSources.get(msg.id);
								const change: CollectionChange<any> = msg.change;
								for (const ds of dss) {
									switch (change.operationDetailed) {
										case 'append':
											ds.appendArray(change.items);
											break;
										case 'clear':
											ds.clear();
											break;
										case 'insert':
											ds.insertAt(change.index, ...change.items);
											break;
										case 'merge':
											ds.merge(change.items);
											break;
										case 'prepend':
											ds.unshift(change.items);
											break;
										case 'remove':
											ds.removeRange(change.index, change.index + change.count);
											break;
										case 'removeLeft':
											ds.removeLeft(change.count);
											break;
										case 'removeRight':
											ds.removeRight(change.count);
											break;
										case 'replace':
											ds.set(change.index, change.items[0]);
											break;
										case 'swap':
											ds.swap(change.index, change.index2);
											break;
									}
								}
							}
							break;
						case RemoteProtocol.UPDATE_DUPLEX_DATASOURCE:
							if (client.synchedDuplexDataSources.has(msg.id)) {
								const dss = client.synchedDuplexDataSources.get(msg.id);
								for (const ds of dss) {
									ds.updateDownstream(msg.value);
								}
							}
							break;
					}
				} catch (e) {
					console.warn('Recieved malformed message from server');
					console.warn(e);
				}
			});
			connection.addEventListener('error', (e) => reject(e));
			connection.addEventListener('open', () => resolve(client));
		});
	}
}
const pendingConnections = new Map<string, Promise<AurumServerClient>>();

async function ensureConnection(key: string, aurumServerInfo: AurumServerInfo): Promise<AurumServerClient> {
	if (pendingConnections.has(key)) {
		return pendingConnections.get(key);
	}

	if (!connections.has(key)) {
		const p = AurumServerClient.connect(aurumServerInfo.host, aurumServerInfo.protocol);
		pendingConnections.set(key, p);
		connections.set(key, await p);
		pendingConnections.delete(key);
	}
}
