import { assert, describe, beforeEach, afterEach, it } from 'vitest';
import { SinonFakeTimers, useFakeTimers } from 'sinon';
import {
    ArrayDataSource,
    Aurum,
    CancellationToken,
    DataSource,
    dsCriticalSection,
    dsDelay,
    dsFilter,
    dsForkInline,
    dsLock,
    dsMap,
    dsPick,
    dsReduce,
    dsTap,
    dsUnique
} from '../../src/aurumjs.js';
import { DuplexDataSource } from '../../src/stream/duplex_data_source.js';
import { ddsFilter, ddsMap, ddsUnique } from '../../src/stream/duplex_data_source_operators.js';

describe('Datasource', () => {
    let attachToken: CancellationToken;

    let clock: SinonFakeTimers;
    beforeEach(() => {
        clock = useFakeTimers();
    });
    afterEach(() => {
        clock.uninstall();
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('should take 3 values', async () => {
        let ds = new DataSource();
        const generator = ds.take(3);
        ds.update(1);
        ds.update(2);
        ds.update(3);

        const values = [];
        for await (const value of generator) {
            values.push(value);
        }

        assert.deepEqual(values, [1, 2, 3]);
    });

    it('should render the data source value', () => {
        const ds = new DataSource<any>(12);
        const ds2 = new DataSource<any>();
        const ds3 = new ArrayDataSource<any>([]);

        attachToken = Aurum.attach(
            <div>
                <div>{ds}</div>
            </div>,
            document.getElementById('target')
        );
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '12');

        ds.update(99);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '99');

        ds.update([]);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '');

        ds.update('test');
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, 'test');

        ds.update([1, 2, 3]);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '123');

        ds.update([1, 'test', '8']);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '1test8');

        ds.update([1, [2, [3, [4], 5]], 6]);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '123456');

        ds.update(undefined);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '');

        ds.update(1);
        ds.update(null);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '');

        ds2.update(5);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '');

        ds.update(ds2);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '5');

        ds.update(ds3);
        ds3.push('2', 3, 4);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '234');
    });

    it('should allow omitting initial value', () => {
        let ds = new DataSource();
        assert(ds.value === undefined);
    });

    it('should take initial value', () => {
        let ds = new DataSource(123);
        assert(ds.value === 123);
    });

    it('should update value', () => {
        let ds = new DataSource(123);
        assert.equal(ds.value, 123);
        ds.update(321);
        assert.equal(ds.value, 321);
    });

    it('should fire events', () => {
        return new Promise<void>((resolve) => {
            let ds = new DataSource(123);

            assert(ds.value === 123);
            ds.listen((value) => {
                assert(value === 321);
                resolve();
            });
            ds.update(321);
            assert.equal(ds.value, 321);
        });
    });

    it('should cancel events', () => {
        let ds = new DataSource(123);

        assert(ds.value === 123);
        ds.listen((value) => {
            throw new Error('should have been canceled');
        });
        ds.cancelAll();
        ds.update(321);
    });

    it('should filter updates', () => {
        let ds = new DataSource(123);
        let filtered = ds.transform(dsFilter((v) => v > 200));
        assert(filtered.value === undefined);
        ds.update(100);
        assert(filtered.value === undefined);
        ds.update(200);
        assert(filtered.value === undefined);
        ds.update(300);
        assert(filtered.value === 300);
    });

    it('should pipe updates', () => {
        let ds = new DataSource(123);
        let ds2 = new DataSource(10);
        ds.pipe(ds2);
        assert.equal(ds2.value, 10);
        ds.update(100);
        assert.equal(ds2.value, 100);
        ds.update(200);
        assert.equal(ds2.value, 200);
        ds.update(300);
        assert.equal(ds2.value, 300);
    });

    it('should map updates', () => {
        let ds = new DataSource(123);
        let mapped = ds.transform(dsMap((v) => v + 10));
        assert.equal(mapped.value, 133);
        ds.update(100);
        assert.equal(mapped.value, 110);
        ds.update(200);
        assert.equal(mapped.value, 210);
        ds.update(300);
        assert.equal(mapped.value, 310);
    });

    it('should reduce updates', () => {
        let ds = new DataSource<number>();
        let reduced = ds.transform(dsReduce((p, c) => p + c, 0));
        ds.update(123);
        assert.equal(reduced.value, 123);
        ds.update(100);
        assert.equal(reduced.value, 223);
        ds.update(200);
        assert.equal(reduced.value, 423);
        ds.update(300);
        assert.equal(reduced.value, 723);
    });

    it('should aggregate updates', () => {
        let ds = new DataSource(1);
        let ds2 = new DataSource(1);
        let aggregated = ds.aggregate([ds2], (valueA, valueB) => valueA + valueB);
        assert.equal(aggregated.value, 2);
        ds.update(100);
        assert.equal(aggregated.value, 101);
        ds2.update(200);
        assert.equal(aggregated.value, 300);
        ds.update(5);
        assert.equal(aggregated.value, 205);
    });

    it('should aggregate many sources', () => {
        let ds = new DataSource(1);
        let ds2 = new DataSource(1);
        let ds3 = new DataSource(1);
        let ds4 = new DataSource(1);
        let ds5 = new DataSource(1);
        let ds6 = new DataSource(1);
        let aggregated = ds.aggregate(
            [ds2, ds3, ds4, ds5, ds6],
            (valueA, valueB, valueC, valueD, valueE, valueF) => valueA + valueB + valueC + valueD + valueE + valueF
        );
        assert.equal(aggregated.value, 6);
        ds.update(100);
        assert.equal(aggregated.value, 105);
        ds2.update(200);
        assert.equal(aggregated.value, 304);
        ds3.update(5);
        assert.equal(aggregated.value, 308);
        ds6.update(-7);
        assert.equal(aggregated.value, 300);
    });

    it('should combine updates', () => {
        let ds = new DataSource(1);
        let ds2 = new DataSource(1);
        let combined = ds.combine([ds2]);
        assert.equal(combined.value, 1);
        ds.update(100);
        assert.equal(combined.value, 100);
        ds2.update(200);
        assert.equal(combined.value, 200);
        ds.update(5);
        assert.equal(combined.value, 5);
    });

    it('should pick keys from object updates', () => {
        let ds = new DataSource({ someKey: 123 });
        let pick = ds.transform(dsPick('someKey'));
        assert.equal(pick.value, 123);
        ds.update({ someKey: 100 });
        assert.equal(pick.value, 100);
        ds.update({ someKey: undefined });
        assert(pick.value === undefined);
        ds.update(null);
        assert(pick.value === null);

        ds = new DataSource();
        pick = ds.transform(dsPick('someKey'));
        assert(pick.value === undefined);
    });

    it('should lock updates when lock is set', () => {
        let ds = new DataSource(123);
        const lock = new DataSource(false);
        const ds2 = ds.transform(dsLock(lock));

        assert.equal(ds2.value, 123);

        ds.update(100);
        assert.equal(ds2.value, 100);

        lock.update(true);

        ds.update(200);
        assert.equal(ds2.value, 100);

        lock.update(false);

        assert.equal(ds2.value, 100);

        ds.update(300);

        assert.equal(ds2.value, 300);
    });

    it('should prevent multiple updates from entering the critical section at once', async () => {
        let ds = new DataSource<number>();

        let valueOne: number | undefined = 0;
        let valueTwo: number | undefined = 0;

        ds.transform(
            dsCriticalSection(
                dsTap((v) => (valueOne = v)),
                dsDelay(20),
                dsTap((v) => (valueTwo = v))
            )
        );

        ds.update(100);
        clock.runAllAsync();
        assert.equal(valueOne, 100);
        assert.equal(valueTwo, 0);

        clock.tick(20);
        clock.runAllAsync();
        await sleep(1);
        assert.equal(valueOne, 100);
        assert.equal(valueTwo, 100);

        ds.update(200);
        clock.runAllAsync();
        assert.equal(valueOne, 200);
        assert.equal(valueTwo, 100);
        ds.update(300);
        clock.runAllAsync();
        assert.equal(valueOne, 200);

        clock.tick(20);
        clock.runAllAsync();
        await sleep(1);
        assert.equal(valueOne, 300);
        assert.equal(valueTwo, 200);

        await sleep(20);
        assert.equal(valueOne, 300);
        assert.equal(valueTwo, 300);
    });

    it('should fire unique events', () => {
        return new Promise<void>((resolve) => {
            let i = 0;
            let asserts = [4, 0, 100, 200];
            let ds = new DataSource(0);

            ds.transform(dsUnique()).listen((value) => {
                assert(value === asserts[i++]);
                if (i === asserts.length) {
                    resolve();
                }
            });
            ds.update(0);
            ds.update(4);
            ds.update(4);
            ds.update(0);
            ds.update(0);
            ds.update(100);
            ds.update(100);
            ds.update(200);
        });
    });

    it('should allow forking the stream', async () => {
        let truthy = 0;
        let falsy = 0;
        const ds = new DataSource<number>();
        const ds2 = ds.transform(
            dsForkInline(
                (i) => i % 2 === 0,
                dsTap(() => truthy++),
                dsMap((v) => true)
            ),
            dsForkInline(
                (i) => typeof i === 'number',
                dsTap(() => falsy++),
                dsMap((v) => false)
            )
        );

        ds.update(0);
        await sleep(1);
        assert.equal(truthy, 1);
        assert.equal(falsy, 0);
        assert.equal(ds2.value, true);

        ds.update(1);
        await sleep(1);
        assert.equal(truthy, 1);
        assert.equal(falsy, 1);
        assert.equal(ds2.value, false);
    });

    it('should fire unique events both ways', () => {
        return new Promise<void>((resolve) => {
            let i = 0;
            let asserts = [200, 4, 0, 100, 200];
            let ds = new DuplexDataSource(0);
            let validated = true;

            const ud = ds.transformDuplex(ddsUnique());
            const token = new CancellationToken();
            ud.listen((value) => {
                assert(value === asserts[i++]);
                if (i === asserts.length) {
                    validated = true;
                }
            }, token);
            token.cancel();
            ds.updateDownstream(0);
            ds.updateDownstream(4);
            ds.updateDownstream(0);
            ds.updateDownstream(100);
            ds.updateDownstream(200);
            assert(validated);
            i = 0;
            ds.listen((value) => {
                assert(value === asserts[i++]);
                if (i === asserts.length) {
                    resolve();
                }
            });
            ud.updateUpstream(200);
            ud.updateUpstream(4);
            ud.updateUpstream(4);
            ud.updateUpstream(0);
            ud.updateUpstream(0);
            ud.updateUpstream(100);
            ud.updateUpstream(100);
            ud.updateUpstream(200);
        });
    });

    it('should map updates both ways', () => {
        let ds = new DuplexDataSource(123);
        let mapped = ds.transformDuplex(
            ddsMap(
                (v) => v + 10,
                (v) => v - 10
            )
        );
        assert(mapped.value === 133);
        ds.updateDownstream(100);
        assert.equal(mapped.value, 110);
        ds.updateDownstream(200);
        assert.equal(mapped.value, 210);
        ds.updateDownstream(300);
        assert.equal(mapped.value, 310);

        mapped.updateUpstream(100);
        assert(ds.value === 90);
        mapped.updateUpstream(200);
        assert.equal(ds.value, 190);
        mapped.updateUpstream(300);
        assert.equal(ds.value, 290);
    });

    it('should filter updates both ways', () => {
        let ds = new DuplexDataSource(123);
        let filtered = ds.transformDuplex(
            ddsFilter(
                (v) => v > 200,
                (v) => v > 200
            )
        );

        assert(filtered.value === undefined);
        ds.updateDownstream(100);
        assert(filtered.value === undefined);
        ds.updateDownstream(200);
        assert(filtered.value === undefined);
        ds.updateDownstream(300);
        assert(filtered.value === 300);

        filtered.updateUpstream(100);
        assert(ds.value === 300);
        filtered.updateUpstream(200);
        assert(ds.value === 300);
        filtered.updateUpstream(350);
        assert.equal(ds.value, 350);
    });
    function sleep(ms: number): Promise<void> {
        clock.uninstall();
        return new Promise((resolve) => setTimeout(resolve, ms)).then(() => {
            clock = useFakeTimers();
        });
    }
});
