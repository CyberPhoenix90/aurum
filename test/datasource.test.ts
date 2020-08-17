import { assert } from 'chai';
import { DataSource, CancellationToken, dsFilter } from '../src/aurum';
import { DuplexDataSource } from '../src/stream/duplex_data_source';

describe('Datasource', () => {
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
		assert(ds.value === 123);
		ds.update(321);
		assert(ds.value === 321);
	});

	it('should fire events', () => {
		return new Promise((resolve) => {
			let ds = new DataSource(123);

			assert(ds.value === 123);
			ds.listen((value) => {
				assert(value === 321);
				resolve();
			});
			ds.update(321);
			assert(ds.value === 321);
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
		assert(ds2.value === 10);
		ds.update(100);
		assert(ds2.value === 100);
		ds.update(200);
		assert(ds2.value === 200);
		ds.update(300);
		assert(ds2.value === 300);
	});

	it('should map updates', () => {
		let ds = new DataSource(123);
		let mapped = ds.map((v) => v + 10).persist();
		assert(mapped.value === 133);
		ds.update(100);
		assert(mapped.value === 110);
		ds.update(200);
		assert(mapped.value === 210);
		ds.update(300);
		assert(mapped.value === 310);
	});

	it('should reduce updates', () => {
		let ds = new DataSource(123);
		let reduced = ds.reduce((p, c) => p + c, ds.value).persist();
		assert(reduced.value === 123);
		ds.update(100);
		assert(reduced.value === 223);
		ds.update(200);
		assert(reduced.value === 423);
		ds.update(300);
		assert(reduced.value === 723);
	});

	it('should aggregate updates', () => {
		let ds = new DataSource(1);
		let ds2 = new DataSource(1);
		let aggregated = ds.aggregate(ds2, (valueA, valueB) => valueA + valueB).persist();
		assert(aggregated.value === 2);
		ds.update(100);
		assert(aggregated.value === 101);
		ds2.update(200);
		assert(aggregated.value === 300);
		ds.update(5);
		assert(aggregated.value === 205);
	});

	it('should combine updates', () => {
		let ds = new DataSource(1);
		let ds2 = new DataSource(1);
		let combined = ds.combine([ds2]).persist();
		assert(combined.value === 1);
		ds.update(100);
		assert(combined.value === 100);
		ds2.update(200);
		assert(combined.value === 200);
		ds.update(5);
		assert(combined.value === 5);
	});

	it('should pick keys from object updates', () => {
		let ds = new DataSource({ someKey: 123 });
		let pick = ds.pick('someKey').persist();
		assert(pick.value === 123);
		ds.update({ someKey: 100 });
		assert(pick.value === 100);
		ds.update({ someKey: undefined });
		assert(pick.value === undefined);
		ds.update(null);
		assert(pick.value === null);

		ds = new DataSource();
		pick = ds.pick('someKey');
		assert(pick.value === undefined);
	});

	it('should fire unique events', () => {
		return new Promise((resolve) => {
			let i = 0;
			let asserts = [4, 0, 100, 200];
			let ds = new DataSource(0);

			ds.unique().listen((value) => {
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

	it('should fire unique events both ways', () => {
		return new Promise((resolve) => {
			let i = 0;
			let asserts = [200, 4, 0, 100, 200];
			let ds = new DuplexDataSource(0);
			let validated = true;

			const ud = ds.unique();
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
		let mapped = ds.map(
			(v) => v + 10,
			(v) => v - 10
		);
		assert(mapped.value === 133);
		ds.updateDownstream(100);
		assert(mapped.value === 110);
		ds.updateDownstream(200);
		assert(mapped.value === 210);
		ds.updateDownstream(300);
		assert(mapped.value === 310);

		mapped.updateUpstream(100);
		assert(ds.value === 90);
		mapped.updateUpstream(200);
		assert(ds.value === 190);
		mapped.updateUpstream(300);
		assert(ds.value === 290);
	});

	it('should filter updates both ways', () => {
		let ds = new DuplexDataSource(123);
		let filtered = ds.filter(
			(v) => v > 200,
			(v) => v > 200
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
		assert(ds.value === 350);
	});
});
