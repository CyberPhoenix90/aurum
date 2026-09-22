import { describe, expect, it } from 'vitest';
import {
    REMOTE_PROTOCOL_VERSION,
    ProtocolError,
    RemoteProtocol,
    createRemoteMessage,
    decodeRemoteMessages,
    encodeRemoteMessage,
    validateRemoteMessage
} from '../src/protocol.js';

describe('remote protocol', () => {
    it('round trips stable versioned messages from text and bytes', () => {
        const encoded = encodeRemoteMessage(RemoteProtocol.LISTEN_DATASOURCE, { id: 'value', token: 'secret' });
        const expected = createRemoteMessage(RemoteProtocol.LISTEN_DATASOURCE, { id: 'value', token: 'secret' });
        expect(decodeRemoteMessages(encoded)).toEqual([expected]);
        expect(decodeRemoteMessages(new TextEncoder().encode(encoded))).toEqual([expected]);
    });

    it('validates versions, message types, required fields, nesting, and byte limits', () => {
        expect(() => decodeRemoteMessages(JSON.stringify({ version: REMOTE_PROTOCOL_VERSION + 1, type: RemoteProtocol.HELLO }))).toThrow(
            'Unsupported protocol version'
        );
        expect(() => decodeRemoteMessages(JSON.stringify({ version: REMOTE_PROTOCOL_VERSION, type: 'unknown' }))).toThrow('Unknown message type');
        expect(() => decodeRemoteMessages(JSON.stringify(createRemoteMessage(RemoteProtocol.LISTEN_DATASOURCE)))).toThrow('requires a string id');
        expect(() =>
            decodeRemoteMessages(
                JSON.stringify(
                    createRemoteMessage(RemoteProtocol.BATCH, {
                        messages: [createRemoteMessage(RemoteProtocol.BATCH, { messages: [] })]
                    })
                )
            )
        ).toThrow('Nested batches');
        expect(() => decodeRemoteMessages(encodeRemoteMessage(RemoteProtocol.HELLO), 1)).toThrow('exceeds 1 bytes');
        expect(() => decodeRemoteMessages(encodeRemoteMessage(RemoteProtocol.UPDATE_ARRAY_DATASOURCE, { id: 'items', change: {} }))).toThrow(
            'Array updates require a revision'
        );
        expect(() => decodeRemoteMessages(encodeRemoteMessage(RemoteProtocol.SUBSCRIPTION_ACK, { id: 'items' }))).toThrow(
            'requires a valid subscriptionType'
        );
    });

    it('decodes batches and byte views without reading outside the supplied view', () => {
        const batch = encodeRemoteMessage(RemoteProtocol.BATCH, {
            messages: [
                createRemoteMessage(RemoteProtocol.HEARTBEAT),
                createRemoteMessage(RemoteProtocol.UPDATE_DATASOURCE, { id: 'value', value: 2 })
            ]
        });
        expect(decodeRemoteMessages(batch).map((message) => message.type)).toEqual([
            RemoteProtocol.HEARTBEAT,
            RemoteProtocol.UPDATE_DATASOURCE
        ]);

        const framed = new TextEncoder().encode(`ignored${encodeRemoteMessage(RemoteProtocol.HELLO)}ignored`);
        const view = new Uint8Array(framed.buffer, 7, framed.byteLength - 14);
        expect(decodeRemoteMessages(view)).toEqual([createRemoteMessage(RemoteProtocol.HELLO)]);
        expect(decodeRemoteMessages(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength))).toEqual([
            createRemoteMessage(RemoteProtocol.HELLO)
        ]);
    });

    it('rejects malformed JSON, batch shapes, and invalid optional field types', () => {
        const invalid = (payload: Record<string, unknown>, message: string): void => {
            expect(() => validateRemoteMessage({ version: REMOTE_PROTOCOL_VERSION, type: RemoteProtocol.HELLO, ...payload })).toThrow(message);
        };

        expect(() => decodeRemoteMessages('{')).toThrowError(ProtocolError);
        expect(() => decodeRemoteMessages(encodeRemoteMessage(RemoteProtocol.BATCH))).toThrow('requires a messages array');
        expect(() => validateRemoteMessage(null)).toThrow('must be an object');
        expect(() => validateRemoteMessage([])).toThrow('must be an object');
        invalid({ token: 1 }, 'token must be a string');
        invalid({ error: 1 }, 'Error must be a string');
        invalid({ errorCode: '500' }, 'Error code must be a number');
        invalid({ revision: -1 }, 'Revision must be a non-negative safe integer');
        invalid({ revision: Number.MAX_SAFE_INTEGER + 1 }, 'Revision must be a non-negative safe integer');
        invalid({ snapshot: 'yes' }, 'Snapshot must be a boolean');
        expect(() => validateRemoteMessage(createRemoteMessage(RemoteProtocol.CANCEL_RPC))).toThrow('requires a string uuid');
    });
});
