import { assert } from 'chai';
import { ObjectDataSource } from '../../src/stream/object_data_source';

describe('object data source', () => {
    let testObject;

    beforeEach(() => {
        testObject = {
            a: 1,
            b: '2',
            c: true,
            d: null,
            e: undefined,
            f: [1, 2, 3],
            g: {
                a: 1,
                b: '2',
                c: true,
                d: null,
                e: undefined,
                f: [1, 2, 3],
                g: {
                    a: 1,
                    b: '2'
                }
            }
        };
    });

    it('wrap', () => {
        const wrapper = new ObjectDataSource(testObject);
        assert.equal(wrapper.get('a'), 1);
        assert.equal(wrapper.get('b'), '2');
        wrapper.set('a', 2);
        assert.equal(wrapper.get('a'), 2);
    });

    it('create synchronized datasource from property', () => {
        const wrapper = new ObjectDataSource(testObject);
        const datasource = wrapper.pick('a');
        assert.equal(datasource.value, 1);
        wrapper.set('a', 2);
        assert.equal(datasource.value, 2);

        datasource.update(3);
        assert.equal(wrapper.get('a'), 3);
    });

    it('create synchronized duplex datasource from property', () => {
        const wrapper = new ObjectDataSource(testObject);
        const datasource = wrapper.pickDuplex('a');
        assert.equal(datasource.value, 1);
        wrapper.set('a', 2);
        assert.equal(datasource.value, 2);

        datasource.updateDownstream(3);
        assert.equal(wrapper.get('a'), 2);
        datasource.updateUpstream(3);
        assert.equal(wrapper.get('a'), 3);
    });

    it('toDataSource', () => {
        const wrapper = new ObjectDataSource(testObject);
        const datasource = wrapper.toDataSource();

        let i = 0;
        datasource.listenAndRepeat((c) => {
            switch (i++) {
                case 0:
                case 1:
                    assert.equal(c, testObject);
                    break;
                default:
                    throw new Error('unexpected');
            }
        });

        assert.equal(datasource.value, testObject);
        wrapper.set('a', 2);
        assert.equal(datasource.value, testObject);
    });

    it('create synchronized arraydatasource from property', () => {
        const wrapper = new ObjectDataSource(testObject);
        const datasource = wrapper.pickArray('f');
        assert.deepEqual(datasource.getData(), [1, 2, 3]);
        wrapper.set('f', [4, 5, 6]);
        assert.deepEqual(datasource.getData(), [4, 5, 6]);

        datasource.push(7);
        assert.deepEqual(wrapper.get('f'), [4, 5, 6, 7]);
    });

    it('create synchronized objectdatasource from property', () => {
        const wrapper = new ObjectDataSource(testObject);
        const datasource = wrapper.pickObject('g');
        assert.deepEqual(datasource.getData(), {
            a: 1,
            b: '2',
            c: true,
            d: null,
            e: undefined,
            f: [1, 2, 3],
            g: {
                a: 1,
                b: '2'
            }
        });
        wrapper.set('g', {
            a: 4,
            b: '5',
            c: false,
            d: null,
            e: undefined,
            f: [4, 5, 6]
        });
        assert.deepEqual(datasource.getData(), {
            a: 4,
            b: '5',
            c: false,
            d: null,
            e: undefined,
            f: [4, 5, 6]
        });

        datasource.set('a', 7);
        assert.deepEqual(wrapper.get('g'), {
            a: 7,
            b: '5',
            c: false,
            d: null,
            e: undefined,
            f: [4, 5, 6]
        });
    });

    it('create nested datasource', () => {
        const wrapper = new ObjectDataSource(testObject);
        const wrapper2 = wrapper.pickObject('g');

        const datasource = wrapper2.pick('a');
        assert.equal(datasource.value, 1);
        wrapper2.set('a', 2);
        assert.equal(datasource.value, 2);
    });
});
