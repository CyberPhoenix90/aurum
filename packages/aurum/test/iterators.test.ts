import { expect } from 'chai';
import { dsFilter, dsMap, promiseIterator, transformAsyncIterator } from '../src/aurumjs.js';
import 'mocha';

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
            i++;
            expect(p.status).to.equal('fulfilled');
            expect((p as PromiseFulfilledResult<number>).value).to.be.oneOf([1, 2, 3]);
        }

        expect(i).to.equal(3);
    });

    it('should be able to map iterator', async () => {
        let i = 0;
        for await (const item of transformAsyncIterator(
            testGenerator(),
            dsMap((v) => v * 2)
        )) {
            expect(item).to.equal(i * 2);
            i++;
        }

        expect(i).to.equal(10);
    });

    it('should be able to filter iterator', async () => {
        let i = 0;
        for await (const item of transformAsyncIterator(
            testGenerator(),
            dsMap((v) => v * 2),
            dsFilter((v) => v % 4 === 0)
        )) {
            expect(item).to.equal(i * 4);
            i++;
        }

        expect(i).to.equal(5);
    });
});
