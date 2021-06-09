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
	const key = makeKey(aurumServerInfo.protocol, aurumServerInfo.host);
	await ensureConnection(key, aurumServerInfo.protocol, aurumServerInfo.host);
	connections.get(key).syncDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

function makeKey(protocol: 'wss' | 'ws', host: string): string {
	return `${resolveProtocol(protocol)}://${resolveHost(host)}`;
}

export async function syncArrayDataSource(source: ArrayDataSource<any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
	const key = makeKey(aurumServerInfo.protocol, aurumServerInfo.host);
	await ensureConnection(key, aurumServerInfo.protocol, aurumServerInfo.host);
	connections.get(key).syncArrayDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

export async function syncDuplexDataSource(source: DuplexDataSource<any>, aurumServerInfo: AurumServerInfo, cancellation: CancellationToken): Promise<void> {
	const key = makeKey(aurumServerInfo.protocol, aurumServerInfo.host);
	await ensureConnection(key, aurumServerInfo.protocol, aurumServerInfo.host);
	connections.get(key).syncDuplexDataSource(source, aurumServerInfo.id, aurumServerInfo.authenticationToken, cancellation);
}

const connections: Map<string, AurumServerClient> = new Map();
const pendingConnections = new Map<string, Promise<AurumServerClient>>();

class AurumServerClient {
	private masterToken: CancellationToken;
	private readonly connection: WebSocket;
	private synchedDataSources: Map<string, Map<string, { source: DataSource<any>; token: CancellationToken }[]>>;
	private synchedDuplexDataSources: Map<string, Map<string, { source: DuplexDataSource<any>; token: CancellationToken }[]>>;
	private synchedArrayDataSources: Map<string, Map<string, { source: ArrayDataSource<any>; token: CancellationToken }[]>>;

	private constructor(connection: WebSocket) {
		this.masterToken = new CancellationToken();
		this.connection = connection;
		this.synchedDataSources = new Map();
		this.synchedDuplexDataSources = new Map();
		this.synchedArrayDataSources = new Map();
	}

	public syncDataSource(dataSource: DataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
		cancellation.addCancelable(() => {
			const listenersByAuth = this.synchedDataSources.get(id);
			const listeners = listenersByAuth.get(authenticationToken);
			listeners.splice(listeners.findIndex((s) => s.source === dataSource));
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
			this.synchedDataSources.set(id, new Map());
		}
		if (!this.synchedDataSources.get(id).has(authenticationToken)) {
			this.connection.send(
				JSON.stringify({
					type: RemoteProtocol.LISTEN_DATASOURCE,
					id,
					token: authenticationToken
				})
			);
			this.synchedDataSources.get(id).set(authenticationToken, [{ source: dataSource, token: cancellation }]);
		} else {
			this.synchedDataSources.get(id).get(authenticationToken).push({ source: dataSource, token: cancellation });
		}
	}

	public syncArrayDataSource(dataSource: ArrayDataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
		cancellation.addCancelable(() => {
			const listenersByAuth = this.synchedArrayDataSources.get(id);
			const listeners = listenersByAuth.get(authenticationToken);
			listeners.splice(listeners.findIndex((s) => s.source === dataSource));
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
			this.synchedArrayDataSources.set(id, new Map());
		}
		if (!this.synchedArrayDataSources.get(id).has(authenticationToken)) {
			this.connection.send(
				JSON.stringify({
					type: RemoteProtocol.LISTEN_ARRAY_DATASOURCE,
					id,
					token: authenticationToken
				})
			);
			this.synchedArrayDataSources.get(id).set(authenticationToken, [{ source: dataSource, token: cancellation }]);
		} else {
			this.synchedArrayDataSources.get(id).get(authenticationToken).push({ source: dataSource, token: cancellation });
		}
	}

	public syncDuplexDataSource(dataSource: DuplexDataSource<any>, id: string, authenticationToken: string, cancellation: CancellationToken): void {
		cancellation.addCancelable(() => {
			const listenersByAuth = this.synchedDuplexDataSources.get(id);
			const listeners = listenersByAuth.get(authenticationToken);
			listeners.splice(listeners.findIndex((s) => s.source === dataSource));
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
		}, CancellationToken.fromMultiple([cancellation, this.masterToken]));

		if (!this.synchedDuplexDataSources.has(id)) {
			this.synchedDuplexDataSources.set(id, new Map());
		}
		if (!this.synchedDuplexDataSources.get(id).has(authenticationToken)) {
			this.connection.send(
				JSON.stringify({
					type: RemoteProtocol.LISTEN_DUPLEX_DATASOURCE,
					id,
					token: authenticationToken
				})
			);
			this.synchedDuplexDataSources.get(id).set(authenticationToken, [{ source: dataSource, token: cancellation }]);
		} else {
			this.synchedDuplexDataSources.get(id).get(authenticationToken).push({ source: dataSource, token: cancellation });
		}
	}

	public static connect(host: string, protocol?: 'ws' | 'wss'): Promise<AurumServerClient> {
		let pendingToken = new CancellationToken();
		let started = false;
		let latency = [0, 0, 0, 0];
		let cycle = 0;
		let latencyTs;
		let lastBeat;
		return new Promise((resolve, reject) => {
			protocol = resolveProtocol(protocol);
			host = resolveHost(host);
			const connection = new WebSocket(`${protocol}://${host}`);
			const client = new AurumServerClient(connection);
			client.masterToken.addCancelable(() => {
				connections.delete(makeKey(protocol, host));
			});

			pendingToken.setTimeout(() => {
				connection.close(4001, 'no response');
				reject();
				client.masterToken.cancel();
			}, 5000);

			connection.addEventListener('message', (m) => {
				lastBeat = Date.now();
				try {
					const msg = JSON.parse(m.data);
					switch (msg.type) {
						case RemoteProtocol.HEARTBEAT:
							latency[cycle] = Date.now() - latencyTs;
							if ((cycle + 1) % latency.length === 0) {
								console.log(`AurumServer latency: ${(latency.reduce((p, c) => p + c) / latency.length).toFixed(1)}ms`);
								cycle = 0;
							} else {
								cycle++;
							}
							break;
						case RemoteProtocol.UPDATE_DATASOURCE:
							if (client.synchedDataSources.has(msg.id)) {
								const byAuth = client.synchedDataSources.get(msg.id);
								for (const dss of byAuth.values()) {
									for (const ds of dss) {
										ds.source.update(msg.value);
									}
								}
							}
							break;
						case RemoteProtocol.UPDATE_ARRAY_DATASOURCE:
							if (client.synchedArrayDataSources.has(msg.id)) {
								const byAuth = client.synchedArrayDataSources.get(msg.id);
								for (const dss of byAuth.values()) {
									const change: CollectionChange<any> = msg.change;
									for (const ds of dss) {
										ds.source.applyCollectionChange(change);
									}
								}
							}
							break;
						case RemoteProtocol.UPDATE_DUPLEX_DATASOURCE:
							if (client.synchedDuplexDataSources.has(msg.id)) {
								const byAuth = client.synchedDuplexDataSources.get(msg.id);
								for (const dss of byAuth.values()) {
									for (const ds of dss) {
										ds.source.updateDownstream(msg.value);
									}
								}
							}
							break;
					}
				} catch (e) {
					console.warn('Recieved malformed message from server');
					console.warn(e);
				}
			});
			connection.addEventListener('error', (e) => {
				client.masterToken.cancel();
				reject(e);
			});
			connection.addEventListener('open', () => {
				pendingToken.cancel();
				pendingToken = undefined;
				started = true;
				lastBeat = Date.now();
				client.masterToken.setInterval(() => {
					if (Date.now() - lastBeat > 10000) {
						connection.close(4000, 'timeout');
						return;
					}
					latencyTs = Date.now();
					connection.send(
						JSON.stringify({
							type: RemoteProtocol.HEARTBEAT
						})
					);
				}, 2500);

				resolve(client);
			});
			connection.addEventListener('close', () => {
				client.masterToken.cancel();
				if (started) {
					ensureConnection(makeKey(protocol, host), protocol, host).then((newClient) => {
						newClient.migrate(client);
					});
				} else {
					reject();
				}
			});
		});
	}

	private migrate(client: AurumServerClient) {
		for (const id of client.synchedDataSources.keys()) {
			for (const auth of client.synchedDataSources.get(id).keys()) {
				for (const { source, token } of client.synchedDataSources.get(id).get(auth)) {
					this.syncDataSource(source, id, auth, token);
				}
			}
		}
		for (const id of client.synchedArrayDataSources.keys()) {
			for (const auth of client.synchedArrayDataSources.get(id).keys()) {
				for (const { source, token } of client.synchedArrayDataSources.get(id).get(auth)) {
					this.syncArrayDataSource(source, id, auth, token);
				}
			}
		}
		for (const id of client.synchedDuplexDataSources.keys()) {
			for (const auth of client.synchedDuplexDataSources.get(id).keys()) {
				for (const { source, token } of client.synchedDuplexDataSources.get(id).get(auth)) {
					this.syncDuplexDataSource(source, id, auth, token);
				}
			}
		}
		this.synchedDataSources = new Map();
		this.synchedDuplexDataSources = new Map();
		this.synchedArrayDataSources = new Map();
	}
}

function resolveProtocol(protocol: 'ws' | 'wss'): 'ws' | 'wss' {
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
	return protocol;
}

function resolveHost(host: string): string {
	if (!host) {
		if (typeof location === 'undefined') {
			throw new Error('Host is not optional in non browser environments');
		}
		return location.host;
	}
	return host;
}

async function ensureConnection(key: string, protocol: 'ws' | 'wss', host: string): Promise<AurumServerClient> {
	let backoff = 1000;
	if (pendingConnections.has(key)) {
		return pendingConnections.get(key);
	}

	if (!connections.has(key)) {
		const pendingConnection = new Promise<AurumServerClient>((resolve) => {
			async function tryConnect() {
				const p = AurumServerClient.connect(host, protocol);
				try {
					const client = await p;
					connections.set(key, client);
					pendingConnections.delete(key);
					resolve(client);
					backoff = 1000;
				} catch (e) {
					setTimeout(() => {
						backoff += 1000;
						tryConnect();
					}, backoff);
				}
			}
			tryConnect();
		});
		pendingConnections.set(key, pendingConnection);
		return pendingConnection;
	}
}
