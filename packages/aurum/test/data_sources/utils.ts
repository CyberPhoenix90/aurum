import { assert } from 'chai';
import { ObjectDataSource, unwrapObjectRecursive } from '../../src/aurumjs.js';
import { ArrayDataSource, DataSource } from '../../src/stream/data_source.js';

describe('Data source utils', () => {
    it('should unwrap recursively', () => {
        const wrapped = {
            a: {
                b: new DataSource(1),
                c: new ArrayDataSource([2, 3])
            },
            d: new DataSource(3),
            e: new ArrayDataSource([new DataSource(1), new DataSource(2)]),
            f: new ObjectDataSource({
                g: new DataSource(1),
                h: new ArrayDataSource([2, 3]),
                i: 3
            })
        };

        assert.deepEqual(unwrapObjectRecursive(wrapped), {
            a: {
                b: 1,
                c: [2, 3]
            },
            d: 3,
            e: [1, 2],
            f: {
                g: 1,
                h: [2, 3],
                i: 3
            }
        });
    });
});
