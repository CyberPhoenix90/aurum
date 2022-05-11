import { CancellationToken, RemoteProtocol } from 'aurumjs';
import * as ws from 'ws';

export class Client {
    public readonly mapdsSubscriptions: Map<string, CancellationToken>;
    public readonly dsSubscriptions: Map<string, CancellationToken>;
    public readonly adsSubscriptions: Map<string, CancellationToken>;
    public readonly ddsSubscriptions: Map<string, CancellationToken>;
    public readonly connection: ws;
    public timeSinceLastMessage: number;

    constructor(connection: ws) {
        this.connection = connection;
        this.mapdsSubscriptions = new Map();
        this.dsSubscriptions = new Map();
        this.adsSubscriptions = new Map();
        this.ddsSubscriptions = new Map();
    }

    public sendMessage(messageType: RemoteProtocol, payload: any) {
        this.connection.send(JSON.stringify({ type: messageType, ...payload }));
    }

    public dispose(): void {
        for (const sub of this.mapdsSubscriptions.values()) {
            sub.cancel();
        }
        for (const sub of this.dsSubscriptions.values()) {
            sub.cancel();
        }
        for (const sub of this.adsSubscriptions.values()) {
            sub.cancel();
        }
        for (const sub of this.ddsSubscriptions.values()) {
            sub.cancel();
        }
    }
}
