import { CancellationToken } from 'aurumjs';
import { Client } from './client';

export class Session<T> {
    public readonly connectionToken: CancellationToken;
    // Freely usable field to store data in the session.
    public tag: T;
    private client: Client<T>;

    constructor(client: Client<T>, connectionToken: CancellationToken) {
        this.connectionToken = connectionToken;
        this.client = client;
    }

    public terminate(): void {
        this.client.dispose();
    }
}
