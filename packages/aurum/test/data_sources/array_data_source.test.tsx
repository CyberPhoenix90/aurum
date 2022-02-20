import { assert } from 'chai';
import { ArrayDataSource, Aurum, CancellationToken, DataSource, DuplexDataSource, SetDataSource } from '../../src/aurumjs';

describe('ArrayDatasource', () => {
    let attachToken: CancellationToken;
    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('should render the array data source value', () => {
        const ads = new ArrayDataSource<any>();

        attachToken = Aurum.attach(<div>{ads}</div>, document.getElementById('target'));

        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '');
        ads.push(1, 2);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '12');
        ads.push(7);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '127');
        ads.removeAt(1);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '17');
    });

    it('should render the array data source value 2', () => {
        const ads = new ArrayDataSource<any>();

        attachToken = Aurum.attach(<div>{ads}</div>, document.getElementById('target'));

        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '');
        ads.push([1, 2]);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '12');
        ads.push([5, 6, 7]);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '12567');
        ads.push(['a', 'b', 'c']);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '12567abc');
        ads.removeAt(1);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '12abc');
        ads.push(['y', new ArrayDataSource([1, 2, 3, 4]), 'z']);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '12abcy1234z');
    });

    it('should sync dom when swapping', () => {
        const ads = new ArrayDataSource<any>();

        attachToken = Aurum.attach(
            <div>
                {ads.map((e) => (
                    <li>{e}</li>
                ))}
            </div>,
            document.getElementById('target')
        );

        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '');
        ads.appendArray([1, 2]);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '12');
        ads.swap(0, 1);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '21');
        ads.swap(1, 0);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '12');
        ads.appendArray([3, 4]);
        ads.swap(1, 3);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '1432');
        ads.appendArray([5, 6, 7]);
        ads.swap(4, 1);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '1532467');
        ads.swap(1, 1);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '1532467');
        ads.swap(1, 2);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '1352467');
        ads.swap(2, 3);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '1325467');
        ads.swap(2, 3);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '1352467');
    });

    it('should store values', () => {
        let ds = new ArrayDataSource([1, 2, 3]);
        assert.deepEqual(ds.toArray(), [1, 2, 3]);
    });

    it('should be iterable', () => {
        let ds = new ArrayDataSource([1, 2, 3]);
        const test = [new Error('Should not get here'), 3, 2, 1];
        for (const v of ds) {
            assert.deepEqual(v, test.pop());
        }
    });

    it('push', () => {
        let ds = new ArrayDataSource([1, 2, 3]);
        ds.push(4, 5);
        assert.deepEqual(ds.toArray(), [1, 2, 3, 4, 5]);
    });

    it('splice', () => {
        let ds = new ArrayDataSource([1, 2, 3, 4, 5, 6]);
        let control = [1, 2, 3, 4, 5, 6];
        ds.splice(2, 2);
        control.splice(2, 2);
        assert.deepEqual(ds.toArray(), control);

        ds = new ArrayDataSource([1, 2, 3, 4, 5, 6]);
        control = [1, 2, 3, 4, 5, 6];
        ds.splice(3, 0, 1, 2);
        control.splice(3, 0, 1, 2);
        assert.deepEqual(ds.toArray(), control);

        ds = new ArrayDataSource([1, 2, 3, 4, 5, 6]);
        control = [1, 2, 3, 4, 5, 6];
        ds.splice(4, 1, 4, 5);
        control.splice(4, 1, 4, 5);
        assert.deepEqual(ds.toArray(), control);
    });

    it('from multiple', () => {
        const ds1 = new ArrayDataSource();
        const ds2 = new ArrayDataSource();
        const ds3 = new ArrayDataSource();
        const ds4 = new ArrayDataSource();
        let ds = ArrayDataSource.fromMultipleSources([ds1, ds2, [1, 2, 3], ds3, ds4, [1, 2]]);

        assert.deepEqual(ds.toArray(), [1, 2, 3, 1, 2]);

        ds3.push(9, 8);
        assert.deepEqual(ds.toArray(), [1, 2, 3, 9, 8, 1, 2]);

        ds1.push(1, 2, 3, 4);
        assert.deepEqual(ds.toArray(), [1, 2, 3, 4, 1, 2, 3, 9, 8, 1, 2]);

        ds1.removeLeft(2);
        assert.deepEqual(ds.toArray(), [3, 4, 1, 2, 3, 9, 8, 1, 2]);

        ds3.clear();
        assert.deepEqual(ds.toArray(), [3, 4, 1, 2, 3, 1, 2]);

        ds4.push(4, 4, 4);
        assert.deepEqual(ds.toArray(), [3, 4, 1, 2, 3, 4, 4, 4, 1, 2]);

        ds2.push(3, 3, 3);
        assert.deepEqual(ds.toArray(), [3, 4, 3, 3, 3, 1, 2, 3, 4, 4, 4, 1, 2]);

        ds2.insertAt(2, 5);
        assert.deepEqual(ds.toArray(), [3, 4, 3, 3, 5, 3, 1, 2, 3, 4, 4, 4, 1, 2]);
    });

    it('from multiple 2', () => {
        const ds1 = new ArrayDataSource();
        const ds2 = new ArrayDataSource();
        const ds3 = new ArrayDataSource();
        const ds4 = new ArrayDataSource();

        const ds = new DataSource();
        const dds = new DuplexDataSource();
        let ads = ArrayDataSource.fromMultipleSources([ds1, ds, ds2, [1, 2, 3], ds3, ds4, [1, 2], dds]);

        assert.deepEqual(ads.toArray(), [1, 2, 3, 1, 2]);
        ds.update(10);
        assert.deepEqual(ads.toArray(), [10, 1, 2, 3, 1, 2]);
        ds.update(20);
        assert.deepEqual(ads.toArray(), [20, 1, 2, 3, 1, 2]);
        ds.update(undefined);
        assert.deepEqual(ads.toArray(), [1, 2, 3, 1, 2]);
        ds.update([10, 20]);
        assert.deepEqual(ads.toArray(), [10, 20, 1, 2, 3, 1, 2]);

        ds1.push(9);
        ds2.push(8);

        ds.update(10);
        assert.deepEqual(ads.toArray(), [9, 10, 8, 1, 2, 3, 1, 2]);
        ds.update(20);
        assert.deepEqual(ads.toArray(), [9, 20, 8, 1, 2, 3, 1, 2]);
        ds.update(undefined);
        assert.deepEqual(ads.toArray(), [9, 8, 1, 2, 3, 1, 2]);
        ds.update([10, 20]);
        assert.deepEqual(ads.toArray(), [9, 10, 20, 8, 1, 2, 3, 1, 2]);

        dds.updateDownstream(100);
        assert.deepEqual(ads.toArray(), [9, 10, 20, 8, 1, 2, 3, 1, 2, 100]);
        ds1.push(7);
        assert.deepEqual(ads.toArray(), [9, 7, 10, 20, 8, 1, 2, 3, 1, 2, 100]);
        dds.updateDownstream(200);
        assert.deepEqual(ads.toArray(), [9, 7, 10, 20, 8, 1, 2, 3, 1, 2, 200]);

        ds.update([4, 4, 4]);
        assert.deepEqual(ads.toArray(), [9, 7, 4, 4, 4, 8, 1, 2, 3, 1, 2, 200]);
        ds2.push(5);
        assert.deepEqual(ads.toArray(), [9, 7, 4, 4, 4, 8, 5, 1, 2, 3, 1, 2, 200]);
        ds.update(undefined);
        assert.deepEqual(ads.toArray(), [9, 7, 8, 5, 1, 2, 3, 1, 2, 200]);
    });

    it('dynamic to non dynamic 1', () => {
        const dyn: ArrayDataSource<DataSource<number>> = new ArrayDataSource([new DataSource(1), new DataSource(2), new DataSource(3)]);
        const nonDyn = ArrayDataSource.DynamicArrayDataSourceToArrayDataSource(dyn, new CancellationToken());

        assert.deepEqual(nonDyn.toArray(), [1, 2, 3]);

        dyn.push(new DataSource(4));

        assert.deepEqual(nonDyn.toArray(), [1, 2, 3, 4]);

        dyn.get(2).update(5);

        assert.deepEqual(nonDyn.toArray(), [1, 2, 5, 4]);

        dyn.removeAt(1);

        assert.deepEqual(nonDyn.toArray(), [1, 5, 4]);
    });

    it('dynamic to non dynamic 2', () => {
        const options = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta'];
        const allOptions = new SetDataSource(options);

        const usedOptions = new ArrayDataSource<DataSource<string>>();
        usedOptions.push(new DataSource('alpha'));
        usedOptions.push(new DataSource('beta'));

        const unusedOptions = allOptions.difference(
            ArrayDataSource.DynamicArrayDataSourceToArrayDataSource(usedOptions, new CancellationToken()).toSetDataSource(new CancellationToken()),
            new CancellationToken()
        );

        const result = unusedOptions.toArrayDataSource().sort();

        assert.deepEqual(result.toArray(), ['delta', 'epsilon', 'gamma', 'zeta']);

        usedOptions.push(new DataSource('gamma'));

        assert.deepEqual(result.toArray(), ['delta', 'epsilon', 'zeta']);

        usedOptions.get(1).update('delta');

        assert.deepEqual(result.toArray(), ['beta', 'epsilon', 'zeta']);
    });

    it('from multiple 3', () => {
        const ads1 = new ArrayDataSource([1, 2]);
        const ds = new DataSource(3);
        let ads = ArrayDataSource.fromMultipleSources([ads1, ds]);

        assert.deepEqual(ads.toArray(), [1, 2, 3]);

        ads1.push(4);

        assert.deepEqual(ads.toArray(), [1, 2, 4, 3]);

        ds.update(10);

        assert.deepEqual(ads.toArray(), [1, 2, 4, 10]);
    });

    it('flat', () => {
        const ds = new ArrayDataSource([[11, [12], 13], [21, 22, 23, 24], [31], [41, 42], [51, 52, 53, 54, 55], [61]]);
        const flat = ds.flat();
        const flat2 = ds.flat().flat();

        assert.deepEqual(flat.toArray(), [11, [12], 13, 21, 22, 23, 24, 31, 41, 42, 51, 52, 53, 54, 55, 61]);
        assert.deepEqual(flat2.toArray(), [11, 12, 13, 21, 22, 23, 24, 31, 41, 42, 51, 52, 53, 54, 55, 61]);

        ds.push([7]);
        assert.deepEqual(flat.toArray(), [11, [12], 13, 21, 22, 23, 24, 31, 41, 42, 51, 52, 53, 54, 55, 61, 7]);
        assert.deepEqual(flat2.toArray(), [11, 12, 13, 21, 22, 23, 24, 31, 41, 42, 51, 52, 53, 54, 55, 61, 7]);

        ds.push([81, 82], [91, 92, [93]]);
        assert.deepEqual(flat.toArray(), [11, [12], 13, 21, 22, 23, 24, 31, 41, 42, 51, 52, 53, 54, 55, 61, 7, 81, 82, 91, 92, [93]]);
        assert.deepEqual(flat2.toArray(), [11, 12, 13, 21, 22, 23, 24, 31, 41, 42, 51, 52, 53, 54, 55, 61, 7, 81, 82, 91, 92, 93]);

        ds.insertAt(3, [0]);
        assert.deepEqual(flat.toArray(), [11, [12], 13, 21, 22, 23, 24, 31, 0, 41, 42, 51, 52, 53, 54, 55, 61, 7, 81, 82, 91, 92, [93]]);
        assert.deepEqual(flat2.toArray(), [11, 12, 13, 21, 22, 23, 24, 31, 0, 41, 42, 51, 52, 53, 54, 55, 61, 7, 81, 82, 91, 92, 93]);

        ds.removeAt(2);
        assert.deepEqual(flat.toArray(), [11, [12], 13, 21, 22, 23, 24, 0, 41, 42, 51, 52, 53, 54, 55, 61, 7, 81, 82, 91, 92, [93]]);
        assert.deepEqual(flat2.toArray(), [11, 12, 13, 21, 22, 23, 24, 0, 41, 42, 51, 52, 53, 54, 55, 61, 7, 81, 82, 91, 92, 93]);

        ds.removeLeft(2);
        assert.deepEqual(flat.toArray(), [0, 41, 42, 51, 52, 53, 54, 55, 61, 7, 81, 82, 91, 92, [93]]);
        assert.deepEqual(flat2.toArray(), [0, 41, 42, 51, 52, 53, 54, 55, 61, 7, 81, 82, 91, 92, 93]);

        ds.removeRight(2);
        assert.deepEqual(flat.toArray(), [0, 41, 42, 51, 52, 53, 54, 55, 61, 7]);
        assert.deepEqual(flat2.toArray(), [0, 41, 42, 51, 52, 53, 54, 55, 61, 7]);
    });

    it('flat ds', () => {
        const ds = new ArrayDataSource([new ArrayDataSource([1, 2]), new ArrayDataSource([3, 4]), new ArrayDataSource([5])]);
        const flat = ds.flat();

        assert.deepEqual(flat.toArray(), [1, 2, 3, 4, 5]);

        ds.push(new ArrayDataSource([7]));
        assert.deepEqual(flat.toArray(), [1, 2, 3, 4, 5, 7]);

        ds.get(0).push(8);
        assert.deepEqual(flat.toArray(), [1, 2, 8, 3, 4, 5, 7]);
    });

    it('reverse', () => {
        const ds = new ArrayDataSource([1, 2, 3, 4, 5, 6]);
        const reverse = ds.reverse();

        assert.deepEqual(reverse.toArray(), [6, 5, 4, 3, 2, 1]);

        ds.push(7);
        assert.deepEqual(reverse.toArray(), [7, 6, 5, 4, 3, 2, 1]);

        ds.push(8, 9);
        assert.deepEqual(reverse.toArray(), [9, 8, 7, 6, 5, 4, 3, 2, 1]);

        ds.insertAt(3, 0);
        assert.deepEqual(reverse.toArray(), [9, 8, 7, 6, 5, 4, 0, 3, 2, 1]);

        ds.removeAt(2);
        assert.deepEqual(reverse.toArray(), [9, 8, 7, 6, 5, 4, 0, 2, 1]);

        ds.removeLeft(2);
        assert.deepEqual(reverse.toArray(), [9, 8, 7, 6, 5, 4, 0]);

        ds.removeRight(2);
        assert.deepEqual(reverse.toArray(), [7, 6, 5, 4, 0]);
    });

    it('unique', () => {
        const ds = new ArrayDataSource([1, 2, 3, 4, 5, 6]);
        const unique = ds.unique();

        assert.deepEqual(unique.toArray(), [1, 2, 3, 4, 5, 6]);

        ds.push(6);
        assert.deepEqual(unique.toArray(), [1, 2, 3, 4, 5, 6]);

        ds.insertAt(2, 1);
        assert.deepEqual(unique.toArray(), [1, 2, 3, 4, 5, 6]);

        ds.removeAt(0);
        assert.deepEqual(unique.toArray(), [1, 2, 3, 4, 5, 6]);
    });

    it('slice', () => {
        const ds = new ArrayDataSource([1, 2, 3, 4, 5, 6]);
        const dsE = new DataSource(3);
        const sliced = ds.slice(1, dsE);

        assert.deepEqual(sliced.toArray(), [2, 3]);

        ds.push(6);
        assert.deepEqual(sliced.toArray(), [2, 3]);

        ds.insertAt(2, 1);
        assert.deepEqual(sliced.toArray(), [2, 1]);

        ds.removeAt(0);
        assert.deepEqual(sliced.toArray(), [1, 3]);
        dsE.update(4);
        assert.deepEqual(sliced.toArray(), [1, 3, 4]);
    });

    it('merge', () => {
        let ds = new ArrayDataSource([1, 2, 3]);
        ds.merge([6, 7]);
        assert.deepEqual(ds.toArray(), [6, 7]);
        ds.merge([6, 7, 8]);
        assert.deepEqual(ds.toArray(), [6, 7, 8]);
        ds.merge([6, 8, 7]);
        assert.deepEqual(ds.toArray(), [6, 8, 7]);
        ds.merge([5, 6, 8, 7]);
        assert.deepEqual(ds.toArray(), [5, 6, 8, 7]);
        ds.merge([4, 5, 8, 7, 6]);
        assert.deepEqual(ds.toArray(), [4, 5, 8, 7, 6]);
        ds.merge([5, 8, 7, 6, 1]);
        assert.deepEqual(ds.toArray(), [5, 8, 7, 6, 1]);
        ds.merge([2, 4, 6, 8]);
        assert.deepEqual(ds.toArray(), [2, 4, 6, 8]);
        ds.merge([3, 6, 9]);
        assert.deepEqual(ds.toArray(), [3, 6, 9]);
    });

    it('filter + sort', () => {
        const ds = new ArrayDataSource([4, 5, 7, 3, 8, 6, 9, 1, 2]);
        const key = new DataSource(2);
        const reverse = new DataSource<boolean>(false);
        const sorted = ds.filter((v) => v % key.value === 0, [key]).sort((a, b) => (reverse.value ? b - a : a - b), [reverse]);

        assert.deepEqual(sorted.toArray(), [2, 4, 6, 8]);
        key.update(3);
        assert.deepEqual(sorted.toArray(), [3, 6, 9]);
        reverse.update(true);
        assert.deepEqual(sorted.toArray(), [9, 6, 3]);
        key.update(2);
        assert.deepEqual(sorted.toArray(), [8, 6, 4, 2]);
    });

    it('filter + sort + map', () => {
        const ds = new ArrayDataSource([4, 5, 7, 3, 8, 6, 9, 1, 2]);
        const key = new DataSource(2);
        const reverse = new DataSource<boolean>(false);
        const mapped = ds
            .filter((v) => v % key.value === 0, [key])
            .sort((a, b) => (reverse.value ? b - a : a - b), [reverse])
            .map((v) => 'val:' + v);

        assert.deepEqual(mapped.toArray(), ['val:2', 'val:4', 'val:6', 'val:8']);
        key.update(3);
        assert.deepEqual(mapped.toArray(), ['val:3', 'val:6', 'val:9']);
        reverse.update(true);
        assert.deepEqual(mapped.toArray(), ['val:9', 'val:6', 'val:3']);
        key.update(2);
        assert.deepEqual(mapped.toArray(), ['val:8', 'val:6', 'val:4', 'val:2']);
    });

    it('filter + map length', () => {
        const ds = new ArrayDataSource([4, 5, 7, 3, 8, 6, 9, 1, 2]);
        const key = new DataSource(2);
        const mapped = ds.filter((v) => v % key.value === 0, [key]).map((v) => 'val:' + v);

        assert.deepEqual(mapped.length.value, mapped.getData().length);
        key.update(3);
        assert.deepEqual(mapped.length.value, mapped.getData().length);
        key.update(2);
        assert.deepEqual(mapped.length.value, mapped.getData().length);
        key.update(1);
        assert.deepEqual(mapped.length.value, mapped.getData().length);
    });

    it('filter + sort + map + render', () => {
        const ds = new ArrayDataSource([4, 5, 7, 3, 8, 6, 9, 1, 2]);
        const key = new DataSource(2);
        const reverse = new DataSource<boolean>(false);
        const mapped = ds
            .filter((v) => v % key.value === 0, [key])
            .sort((a, b) => (reverse.value ? b - a : a - b), [reverse])
            .map((v) => <div>{v}</div>);

        const token = Aurum.attach(<div>{mapped}</div>, document.getElementById('target'));

        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '2468');
        key.update(3);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '369');
        reverse.update(true);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '963');
        key.update(2);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '8642');

        token.cancel();
    });

    it('filter + sort + map + datasource', () => {
        const ds = new ArrayDataSource([4, 5, 7, 3, 8, 6, 9, 1, 2]);
        const key = new DataSource(2);
        const reverse = new DataSource<boolean>(false);
        const mapped = ds
            .filter((v) => v % key.value === 0, [key])
            .sort((a, b) => (reverse.value ? b - a : a - b), [reverse])
            .map((v) => new DataSource(v));

        const token = Aurum.attach(<div>{mapped}</div>, document.getElementById('target'));

        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '2468');
        key.update(3);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '369');
        reverse.update(true);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '963');
        key.update(2);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '8642');

        token.cancel();
    });

    it('render all types', () => {
        const ads = new ArrayDataSource<any>([4, 5, 7]);
        const ds = new DataSource(2);
        const ads2 = new ArrayDataSource([1, 2, 3]);

        const token = Aurum.attach(<div>{ads}</div>, document.getElementById('target'));

        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '457');

        ads.merge([1, 2, 3]);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '123');

        ads.merge(['0', '0']);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '00');

        ads.merge([1, '0', 2, 3, '0']);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '10230');

        ads.merge(['0', '0']);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '00');

        ads.clear();
        ads.push('0', '0');
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '00');

        ads.push(undefined);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '00');

        ads.push(3);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '003');

        ads.push(null);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '003');

        ads.push(4);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '0034');

        ads.set(2, 'test');
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '00test34');

        ads.clear();
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '');

        ads.push(ds);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '2');

        ds.update(3);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '3');

        ads.push(ads2);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '3123');

        ads2.push(4);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '31234');

        ds.update(1);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '11234');

        ads2.removeLeft(2);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '134');

        ads.remove(ds);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '34');

        ads.remove(ads2);
        assert.deepEqual((document.getElementById('target').firstChild as HTMLDivElement).textContent, '');

        token.cancel();
    });
});
