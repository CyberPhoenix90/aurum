import { expect, describe, it } from 'vitest';
import { dsFilter, dsMap, promiseIterator, transformAsyncIterator } from '../src/aurumjs.js';

describe('Iterators', () => {
    async function* testGenerator(): AsyncGenerator<number> {
        let i = 0;
        while (i < 10) {
            yield i++;
        }

        return;
    }

    it('should iterate over promises', async () => {
        const promises = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
        let i = 0;
        for await (const p of promiseIterator(promises)) {
            expect(p.status).toEqual('fulfilled');
            expect((p as PromiseFulfilledResult<number>).value).toBe([1, 2, 3][i]);
            i++;
        }

        expect(i).toBe(3);
    });

    it('should be able to map iterator', async () => {
        let i = 0;
        for await (const item of transformAsyncIterator(
            testGenerator(),
            dsMap((v) => v * 2)
        )) {
            expect(item).toBe(i * 2);
            i++;
        }

        expect(i).toBe(10);
    });

    it('should be able to filter iterator', async () => {
        let i = 0;
        for await (const item of transformAsyncIterator(
            testGenerator(),
            dsMap((v) => v * 2),
            dsFilter((v) => v % 4 === 0)
        )) {
            expect(item).toBe(i * 4);
            i++;
        }

        expect(i).toBe(5);
    });
});
