import { describe, expect, it } from 'vitest';
import {
    REMOTE_PROTOCOL_VERSION,
    RemoteProtocol,
    createRemoteMessage,
    decodeRemoteMessages,
    encodeRemoteMessage
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
});
