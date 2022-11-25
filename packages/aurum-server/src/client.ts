import { CancellationToken, RemoteProtocol } from 'aurumjs';
import { Session } from './session.js';
import ws from 'ws';

export class Client<T> {
    public readonly mapdsSubscriptions: Map<string, CancellationToken>;
    public readonly dsSubscriptions: Map<string, CancellationToken>;
    public readonly adsSubscriptions: Map<string, CancellationToken>;
    public readonly ddsSubscriptions: Map<string, CancellationToken>;
    public readonly odsSubscriptions: Map<string, CancellationToken>;
    public readonly setdsSubscriptions: Map<string, CancellationToken>;
    public readonly connectionToken: CancellationToken;

    public readonly connection: ws;
    public timeSinceLastMessage: number;
    public session: Session<T>;
    public readonly renderSessions: Map<string, { onDetach: () => void }>;

    constructor(connection: ws) {
        this.connection = connection;
        this.mapdsSubscriptions = new Map();
        this.dsSubscriptions = new Map();
        this.adsSubscriptions = new Map();
        this.ddsSubscriptions = new Map();
        this.odsSubscriptions = new Map();
        this.setdsSubscriptions = new Map();
        this.connectionToken = new CancellationToken();
        this.renderSessions = new Map();
    }

    public sendMessage(messageType: RemoteProtocol, payload: any) {
        this.connection.send(JSON.stringify({ type: messageType, ...payload }));
    }

    public dispose(): void {
        this.connection.close();
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
        for (const sub of this.odsSubscriptions.values()) {
            sub.cancel();
        }
        for (const sub of this.setdsSubscriptions.values()) {
            sub.cancel();
        }

        this.connectionToken.cancel();
    }
}
