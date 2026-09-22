import { ArrayDataSource, CancellationToken, DataSource, DuplexDataSource, MapDataSource, ObjectDataSource, SetDataSource } from '@aurumjs/streams';
import type ws from 'ws';
import { describe, expect, it } from 'vitest';
import { Client } from '../src/client.js';
import { Router } from '../src/router.js';

function createClient(): Client<void> {
    return new Client<void>({ readyState: 3 } as ws, {
        batchDelayMs: 0,
        maxBufferedAmount: 1,
        maxQueueBytes: 1,
        onError: () => undefined
    });
}

function cancellation(label: string, cancelled: string[]): CancellationToken {
    const token = new CancellationToken();
    token.addCancellable(() => cancelled.push(label));
    return token;
}

describe('Router', () => {
    it('exposes every endpoint family with safe authentication defaults', async () => {
        const router = new Router();
        const scalar = new DataSource(1);
        const duplex = new DuplexDataSource(2);
        const array = new ArrayDataSource([3]);
        const map = new MapDataSource(new Map([['four', 4]]));
        const object = new ObjectDataSource({ five: 5 });
        const set = new SetDataSource([6]);
        const func = (value: number): number => value * 2;

        router.exposeDataSource('scalar', scalar);
        router.exposeDuplexDataSource('duplex', duplex, { authenticate: (token, operation) => token === 'write' && operation === 'write' });
        router.exposeArrayDataSource('array', array);
        router.exposeMapDataSource('map', map);
        router.exposeObjectDataSource('object', object);
        router.exposeSetDataSource('set', set);
        router.exposeFunction('double', func);
        router.exposeFunction('legacy', func, { authenticator: (token) => token === 'legacy' });

        expect(router.getExposedDataSource('scalar')?.source).toBe(scalar);
        expect(router.getExposedDuplexDataSource('duplex')?.source).toBe(duplex);
        expect(router.getExposedArrayDataSource('array')?.source).toBe(array);
        expect(router.getExposedMapDataSource('map')?.source).toBe(map);
        expect(router.getExposedObjectDataSource('object')?.source).toBe(object);
        expect(router.getExposedSetDataSource('set')?.source).toBe(set);
        expect(await router.getExposedDataSource('scalar')?.authenticator(undefined, 'read')).toBe(true);
        expect(await router.getExposedDataSource('scalar')?.authenticator(undefined, 'write')).toBe(false);
        expect(await router.getExposedDuplexDataSource('duplex')?.authenticator('write', 'write')).toBe(true);
        expect(await router.getExposedFunction('double')?.authenticator(undefined)).toBe(true);
        expect(await router.getExposedFunction('legacy')?.authenticator('legacy')).toBe(true);
        expect(await router.getExposedFunction('double')?.func(3, undefined as never, new CancellationToken())).toBe(6);
    });

    it('rejects empty and duplicate ids within an endpoint family', () => {
        const router = new Router();
        const source = new DataSource(1);
        expect(() => router.exposeDataSource('', source)).toThrow('Endpoint id cannot be empty');
        router.exposeDataSource('value', source);
        expect(() => router.exposeDataSource('value', source)).toThrow('already exposed');

        router.exposeFunction('work', (): undefined => undefined);
        expect(() => router.exposeFunction('work', (): undefined => undefined)).toThrow('already exposed');
        expect(() => router.exposeFunction('', (): undefined => undefined)).toThrow('Endpoint id cannot be empty');
    });

    it('cancels route-prefixed client subscriptions when endpoints are withdrawn or cleared', () => {
        const router = new Router();
        const client = createClient();
        const cancelled: string[] = [];
        router.attach([client], 'api/');

        const endpointToken = new CancellationToken();
        router.exposeDataSource('temporary', new DataSource(0), { cancellationToken: endpointToken });
        client.dsSubscriptions.set('api/temporary', cancellation('temporary', cancelled));
        endpointToken.cancel();
        expect(cancelled).toEqual(['temporary']);
        expect(client.dsSubscriptions.has('api/temporary')).toBe(false);
        expect(router.getExposedDataSource('temporary')).toBeUndefined();

        router.exposeDataSource('scalar', new DataSource(0));
        router.exposeDuplexDataSource('duplex', new DuplexDataSource(0));
        router.exposeArrayDataSource('array', new ArrayDataSource());
        router.exposeMapDataSource('map', new MapDataSource());
        router.exposeObjectDataSource('object', new ObjectDataSource({}));
        router.exposeSetDataSource('set', new SetDataSource());
        router.exposeFunction('rpc', (): undefined => undefined);
        client.dsSubscriptions.set('api/scalar', cancellation('scalar', cancelled));
        client.ddsSubscriptions.set('api/duplex', cancellation('duplex', cancelled));
        client.adsSubscriptions.set('api/array', cancellation('array', cancelled));
        client.mapdsSubscriptions.set('api/map', cancellation('map', cancelled));
        client.odsSubscriptions.set('api/object', cancellation('object', cancelled));
        client.setdsSubscriptions.set('api/set', cancellation('set', cancelled));

        router.clear();
        expect(cancelled).toEqual(['temporary', 'scalar', 'duplex', 'array', 'map', 'set', 'object']);
        expect(client.subscriptionCount).toBe(0);
        expect(router.getExposedDataSource('scalar')).toBeUndefined();
        expect(router.getExposedDuplexDataSource('duplex')).toBeUndefined();
        expect(router.getExposedArrayDataSource('array')).toBeUndefined();
        expect(router.getExposedMapDataSource('map')).toBeUndefined();
        expect(router.getExposedObjectDataSource('object')).toBeUndefined();
        expect(router.getExposedSetDataSource('set')).toBeUndefined();
        expect(router.getExposedFunction('rpc')).toBeUndefined();
    });

    it('ignores stale endpoint cancellation callbacks after an id is re-exposed', () => {
        const router = new Router();
        const staleSourceToken = new CancellationToken();
        const staleFunctionToken = new CancellationToken();
        router.exposeDataSource('value', new DataSource('old'), { cancellationToken: staleSourceToken });
        router.exposeFunction('work', () => 'old', { cancellationToken: staleFunctionToken });
        router.clear();

        const replacementSource = new DataSource('new');
        const replacementFunction = () => 'new';
        router.exposeDataSource('value', replacementSource);
        router.exposeFunction('work', replacementFunction);
        staleSourceToken.cancel();
        staleFunctionToken.cancel();

        expect(router.getExposedDataSource('value')?.source).toBe(replacementSource);
        expect(router.getExposedFunction('work')?.func).toBe(replacementFunction);
    });
});
