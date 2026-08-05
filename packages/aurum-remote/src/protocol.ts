export const REMOTE_PROTOCOL_VERSION = 1 as const;

export enum RemoteProtocol {
    HELLO = 'hello',
    HELLO_ACK = 'hello.ack',
    HEARTBEAT = 'heartbeat',
    BATCH = 'batch',
    PROTOCOL_ERROR = 'protocol.error',
    SUBSCRIPTION_ACK = 'subscription.ack',

    LISTEN_DATASOURCE = 'datasource.listen',
    LISTEN_DATASOURCE_ERR = 'datasource.listen.error',
    UPDATE_DATASOURCE = 'datasource.update',
    UPDATE_DATASOURCE_ERR = 'datasource.update.error',
    CANCEL_DATASOURCE = 'datasource.cancel',

    PERFORM_RPC = 'rpc.perform',
    PERFORM_RPC_ERR = 'rpc.error',
    PERFORM_RPC_RESULT = 'rpc.result',
    PERFORM_RPC_RESULT_ERR = 'rpc.result.error',
    CANCEL_RPC = 'rpc.cancel',

    LISTEN_DUPLEX_DATASOURCE = 'duplex.listen',
    LISTEN_DUPLEX_DATASOURCE_ERR = 'duplex.listen.error',
    UPDATE_DUPLEX_DATASOURCE = 'duplex.update',
    UPDATE_DUPLEX_DATASOURCE_ERR = 'duplex.update.error',
    CANCEL_DUPLEX_DATASOURCE = 'duplex.cancel',

    LISTEN_ARRAY_DATASOURCE = 'array.listen',
    LISTEN_ARRAY_DATASOURCE_ERR = 'array.listen.error',
    UPDATE_ARRAY_DATASOURCE = 'array.update',
    UPDATE_ARRAY_DATASOURCE_ERR = 'array.update.error',
    CANCEL_ARRAY_DATASOURCE = 'array.cancel',

    LISTEN_MAP_DATASOURCE = 'map.listen',
    LISTEN_MAP_DATASOURCE_ERR = 'map.listen.error',
    UPDATE_MAP_DATASOURCE = 'map.update',
    UPDATE_MAP_DATASOURCE_ERR = 'map.update.error',
    CANCEL_MAP_DATASOURCE = 'map.cancel',

    LISTEN_OBJECT_DATASOURCE = 'object.listen',
    LISTEN_OBJECT_DATASOURCE_ERR = 'object.listen.error',
    UPDATE_OBJECT_DATASOURCE = 'object.update',
    UPDATE_OBJECT_DATASOURCE_ERR = 'object.update.error',
    CANCEL_OBJECT_DATASOURCE = 'object.cancel',

    LISTEN_SET_DATASOURCE = 'set.listen',
    LISTEN_SET_DATASOURCE_ERR = 'set.listen.error',
    UPDATE_SET_DATASOURCE = 'set.update',
    UPDATE_SET_DATASOURCE_ERR = 'set.update.error',
    CANCEL_SET_DATASOURCE = 'set.cancel'
}

export interface RemoteMessage {
    version: typeof REMOTE_PROTOCOL_VERSION;
    type: RemoteProtocol;
    id?: string;
    token?: string;
    uuid?: string;
    value?: unknown;
    change?: unknown;
    result?: unknown;
    error?: string;
    errorCode?: number;
    subscriptionType?: RemoteProtocol;
    revision?: number;
    snapshot?: boolean;
    messages?: RemoteMessage[];
}

const messageTypes = new Set<string>(Object.values(RemoteProtocol));
const subscriptionTypes = new Set<RemoteProtocol>([
    RemoteProtocol.LISTEN_DATASOURCE,
    RemoteProtocol.LISTEN_DUPLEX_DATASOURCE,
    RemoteProtocol.LISTEN_ARRAY_DATASOURCE,
    RemoteProtocol.LISTEN_MAP_DATASOURCE,
    RemoteProtocol.LISTEN_OBJECT_DATASOURCE,
    RemoteProtocol.LISTEN_SET_DATASOURCE
]);
const idRequired = new Set<RemoteProtocol>([
    RemoteProtocol.SUBSCRIPTION_ACK,
    RemoteProtocol.LISTEN_DATASOURCE,
    RemoteProtocol.LISTEN_DATASOURCE_ERR,
    RemoteProtocol.UPDATE_DATASOURCE,
    RemoteProtocol.UPDATE_DATASOURCE_ERR,
    RemoteProtocol.CANCEL_DATASOURCE,
    RemoteProtocol.LISTEN_DUPLEX_DATASOURCE,
    RemoteProtocol.LISTEN_DUPLEX_DATASOURCE_ERR,
    RemoteProtocol.UPDATE_DUPLEX_DATASOURCE,
    RemoteProtocol.UPDATE_DUPLEX_DATASOURCE_ERR,
    RemoteProtocol.CANCEL_DUPLEX_DATASOURCE,
    RemoteProtocol.LISTEN_ARRAY_DATASOURCE,
    RemoteProtocol.LISTEN_ARRAY_DATASOURCE_ERR,
    RemoteProtocol.UPDATE_ARRAY_DATASOURCE,
    RemoteProtocol.UPDATE_ARRAY_DATASOURCE_ERR,
    RemoteProtocol.CANCEL_ARRAY_DATASOURCE,
    RemoteProtocol.LISTEN_MAP_DATASOURCE,
    RemoteProtocol.LISTEN_MAP_DATASOURCE_ERR,
    RemoteProtocol.UPDATE_MAP_DATASOURCE,
    RemoteProtocol.UPDATE_MAP_DATASOURCE_ERR,
    RemoteProtocol.CANCEL_MAP_DATASOURCE,
    RemoteProtocol.LISTEN_OBJECT_DATASOURCE,
    RemoteProtocol.LISTEN_OBJECT_DATASOURCE_ERR,
    RemoteProtocol.UPDATE_OBJECT_DATASOURCE,
    RemoteProtocol.UPDATE_OBJECT_DATASOURCE_ERR,
    RemoteProtocol.CANCEL_OBJECT_DATASOURCE,
    RemoteProtocol.LISTEN_SET_DATASOURCE,
    RemoteProtocol.LISTEN_SET_DATASOURCE_ERR,
    RemoteProtocol.UPDATE_SET_DATASOURCE,
    RemoteProtocol.UPDATE_SET_DATASOURCE_ERR,
    RemoteProtocol.CANCEL_SET_DATASOURCE,
    RemoteProtocol.PERFORM_RPC,
    RemoteProtocol.PERFORM_RPC_ERR,
    RemoteProtocol.PERFORM_RPC_RESULT,
    RemoteProtocol.PERFORM_RPC_RESULT_ERR
]);

export function createRemoteMessage(type: RemoteProtocol, payload: Omit<RemoteMessage, 'version' | 'type'> = {}): RemoteMessage {
    return { version: REMOTE_PROTOCOL_VERSION, type, ...payload };
}

export function encodeRemoteMessage(type: RemoteProtocol, payload: Omit<RemoteMessage, 'version' | 'type'> = {}): string {
    return JSON.stringify(createRemoteMessage(type, payload));
}

export function decodeRemoteMessages(data: string | ArrayBuffer | ArrayBufferView, maxBytes = Number.POSITIVE_INFINITY): RemoteMessage[] {
    const text = toText(data, maxBytes);
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new ProtocolError('Message is not valid JSON');
    }
    const message = validateRemoteMessage(parsed);
    if (message.type === RemoteProtocol.BATCH) {
        if (!Array.isArray(message.messages)) {
            throw new ProtocolError('Batch message requires a messages array');
        }
        return message.messages.map((item) => validateRemoteMessage(item, false));
    }
    return [message];
}

export function validateRemoteMessage(value: unknown, allowBatch = true): RemoteMessage {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new ProtocolError('Message must be an object');
    }
    const message = value as Record<string, unknown>;
    if (message.version !== REMOTE_PROTOCOL_VERSION) {
        throw new ProtocolError(`Unsupported protocol version ${String(message.version)}`);
    }
    if (typeof message.type !== 'string' || !messageTypes.has(message.type)) {
        throw new ProtocolError('Unknown message type');
    }
    const type = message.type as RemoteProtocol;
    if (!allowBatch && type === RemoteProtocol.BATCH) {
        throw new ProtocolError('Nested batches are not allowed');
    }
    if (idRequired.has(type) && typeof message.id !== 'string') {
        throw new ProtocolError(`${type} requires a string id`);
    }
    if (message.token !== undefined && typeof message.token !== 'string') {
        throw new ProtocolError('Authentication token must be a string');
    }
    if (message.error !== undefined && typeof message.error !== 'string') {
        throw new ProtocolError('Error must be a string');
    }
    if (message.errorCode !== undefined && typeof message.errorCode !== 'number') {
        throw new ProtocolError('Error code must be a number');
    }
    if (message.revision !== undefined && (!Number.isSafeInteger(message.revision) || (message.revision as number) < 0)) {
        throw new ProtocolError('Revision must be a non-negative safe integer');
    }
    if (message.snapshot !== undefined && typeof message.snapshot !== 'boolean') {
        throw new ProtocolError('Snapshot must be a boolean');
    }
    if (type === RemoteProtocol.SUBSCRIPTION_ACK) {
        if (typeof message.subscriptionType !== 'string' || !subscriptionTypes.has(message.subscriptionType as RemoteProtocol)) {
            throw new ProtocolError('Subscription acknowledgement requires a valid subscriptionType');
        }
    }
    if (type === RemoteProtocol.UPDATE_ARRAY_DATASOURCE && typeof message.revision !== 'number') {
        throw new ProtocolError('Array updates require a revision');
    }
    if ([RemoteProtocol.PERFORM_RPC, RemoteProtocol.PERFORM_RPC_RESULT, RemoteProtocol.PERFORM_RPC_ERR, RemoteProtocol.PERFORM_RPC_RESULT_ERR, RemoteProtocol.CANCEL_RPC].includes(type) && typeof message.uuid !== 'string') {
        throw new ProtocolError(`${type} requires a string uuid`);
    }
    return message as unknown as RemoteMessage;
}

export class ProtocolError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'ProtocolError';
    }
}

function toText(data: string | ArrayBuffer | ArrayBufferView, maxBytes: number): string {
    if (typeof data === 'string') {
        const bytes = new TextEncoder().encode(data).byteLength;
        if (bytes > maxBytes) {
            throw new ProtocolError(`Message exceeds ${maxBytes} bytes`);
        }
        return data;
    }
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    if (bytes.byteLength > maxBytes) {
        throw new ProtocolError(`Message exceeds ${maxBytes} bytes`);
    }
    return new TextDecoder().decode(bytes);
}
