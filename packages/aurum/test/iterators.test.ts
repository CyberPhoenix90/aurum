import { expect } from 'chai';
import { dsFilter, dsMap, transformAsyncIterator } from '../src/aurumjs';

describe('Iterators', () => {
    async function* testGenerator(): AsyncGenerator<number> {
        let i = 0;
        while (i < 10) {
            yield i++;
        }

        return;
    }

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
