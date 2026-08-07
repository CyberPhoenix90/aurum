import { afterAll, bench, describe } from 'vitest';
import { ArrayDataSource, Aurum, CancellationToken, DataSource, Renderable, renderToTree } from '../src/index.js';
import type { CollectionChange } from '../src/index.js';

const benchmarkOptions = { time: 300, warmupTime: 100 };
const cleanups: Array<() => void> = [];

function Item(props: { label: string | DataSource<string> }): Renderable {
    return <li class="item">{props.label}</li>;
}

function createModels(size: number): Renderable[] {
    return Array.from({ length: size }, (_, index) => <Item label={`item ${index}`} />);
}

function createStaticElements(size: number): Renderable {
    return <ul>{Array.from({ length: size }, (_, index) => <li>{index}</li>)}</ul>;
}

function mountForMeasurement(content: Renderable): void {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const token = Aurum.attach(content, host);
    token.cancel();
    host.remove();
}

function mountPersistent(content: Renderable): CancellationToken {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const token = Aurum.attach(content, host);
    cleanups.push(() => {
        token.cancel();
        host.remove();
    });
    return token;
}

function registerCollectionMutationBenchmarks(
    collectionType: string,
    initialValues: Renderable[],
    createItems: (prefix: string, count: number) => Renderable[]
): void {
    describe(`all ${collectionType} collection mutation methods`, () => {
        const source = new ArrayDataSource<Renderable>(initialValues);
        mountPersistent(<ul>{source}</ul>);
        const middle = Math.floor(initialValues.length / 2);
        const batch = createItems('batch', 10);
        const replacements = createItems('replacement', 2);
        const originalMiddle = source.get(middle);

        bench(`set and restore a ${collectionType} entry`, () => {
            source.set(middle, replacements[0]);
            source.set(middle, originalMiddle);
        }, benchmarkOptions);

        bench(`replace and restore a ${collectionType} entry by value`, () => {
            source.replace(originalMiddle, replacements[0]);
            source.replace(replacements[0], originalMiddle);
        }, benchmarkOptions);

        bench(`swap and restore distant ${collectionType} entries by index`, () => {
            source.swap(0, source.length.value - 1);
            source.swap(0, source.length.value - 1);
        }, benchmarkOptions);

        bench(`swapItems and restore distant ${collectionType} entries`, () => {
            const first = source.get(0);
            const last = source.get(source.length.value - 1);
            source.swapItems(first, last);
            source.swapItems(first, last);
        }, benchmarkOptions);

        bench(`appendArray and remove 10 ${collectionType} entries`, () => {
            source.appendArray(batch);
            source.removeRight(batch.length);
        }, benchmarkOptions);

        bench(`splice and restore 10 middle ${collectionType} entries`, () => {
            const removed = source.splice(middle, batch.length, ...batch);
            source.splice(middle, batch.length, ...removed);
        }, benchmarkOptions);

        bench(`insertAt and remove 10 middle ${collectionType} entries`, () => {
            source.insertAt(middle, ...batch);
            source.removeAt(middle, batch.length);
        }, benchmarkOptions);

        bench(`push and pop a ${collectionType} entry`, () => {
            source.push(batch[0]);
            source.pop();
        }, benchmarkOptions);

        bench(`unshift and shift a ${collectionType} entry`, () => {
            source.unshift(batch[0]);
            source.shift();
        }, benchmarkOptions);

        bench(`pop and restore a ${collectionType} entry`, () => {
            const removed = source.pop();
            source.push(removed);
        }, benchmarkOptions);

        bench(`shift and restore a ${collectionType} entry`, () => {
            const removed = source.shift();
            source.unshift(removed);
        }, benchmarkOptions);

        bench(`removeRight and restore 10 ${collectionType} entries`, () => {
            const removed = source.removeRight(batch.length);
            source.appendArray(removed);
        }, benchmarkOptions);

        bench(`removeLeft and restore 10 ${collectionType} entries`, () => {
            const removed = source.removeLeft(batch.length);
            source.unshift(...removed);
        }, benchmarkOptions);

        bench(`removeWhere and restore 10 ${collectionType} entries`, () => {
            source.insertAt(middle, ...batch);
            const batchItems = new Set(batch);
            source.removeWhere((item) => batchItems.has(item));
        }, benchmarkOptions);

        bench(`removeAt and restore 10 middle ${collectionType} entries`, () => {
            const removed = source.removeAt(middle, batch.length);
            source.insertAt(middle, ...removed);
        }, benchmarkOptions);

        bench(`removeRange and restore 10 middle ${collectionType} entries`, () => {
            const removed = source.removeRange(middle, middle + batch.length);
            source.insertAt(middle, ...removed);
        }, benchmarkOptions);

        bench(`remove and restore a middle ${collectionType} entry by value`, () => {
            const target = source.get(middle);
            const removed = source.remove(target);
            source.insertAt(middle, removed);
        }, benchmarkOptions);

        bench(`clear and restore 1,000 ${collectionType} entries`, () => {
            const removed = source.clear();
            source.appendArray(removed);
        }, benchmarkOptions);

        bench(`applyCollectionChange replace and restore a ${collectionType} entry`, () => {
            const replace = (item: Renderable): CollectionChange<Renderable> => ({
                operation: 'replace',
                operationDetailed: 'replace',
                target: source.get(middle),
                count: 1,
                index: middle,
                items: [item],
                newState: source.toArray()
            });
            source.applyCollectionChange(replace(replacements[1]));
            source.applyCollectionChange(replace(originalMiddle));
        }, benchmarkOptions);

        bench(`repeatCurrentState for 1,000 ${collectionType} entries`, () => {
            source.repeatCurrentState();
        }, benchmarkOptions);
    });
}

function registerMergeBenchmarks(
    collectionType: string,
    initialValues: Renderable[],
    createItems: (prefix: string, count: number) => Renderable[]
): void {
    describe(`${collectionType} collection merge scenarios`, () => {
        const registerAlternatingMerge = (name: string, alternateValues: Renderable[]): void => {
            const source = new ArrayDataSource<Renderable>(initialValues);
            mountPersistent(<ul>{source}</ul>);
            let alternate = true;
            bench(name, () => {
                source.merge(alternate ? alternateValues : initialValues);
                alternate = !alternate;
            }, benchmarkOptions);
        };

        const noOpSource = new ArrayDataSource<Renderable>(initialValues);
        mountPersistent(<ul>{noOpSource}</ul>);
        bench(`merge an identical 1,000-entry ${collectionType} snapshot`, () => {
            noOpSource.merge(noOpSource.toArray());
        }, benchmarkOptions);

        registerAlternatingMerge(
            `merge a one-position rotation of 1,000 retained ${collectionType} entries`,
            [...initialValues.slice(1), initialValues[0]]
        );
        registerAlternatingMerge(`merge a reversal of 1,000 retained ${collectionType} entries`, initialValues.slice().reverse());

        const partialReplacements = createItems('partial merge replacement', 100);
        registerAlternatingMerge(
            `merge 10% churn into 1,000 ${collectionType} entries`,
            initialValues.map((item, index) => (index % 10 === 0 ? partialReplacements[index / 10] : item))
        );

        registerAlternatingMerge(`merge 100% churn into 1,000 ${collectionType} entries`, createItems('full merge replacement', 1_000));
        registerAlternatingMerge(
            `merge between 1,000 and 1,200 ${collectionType} entries`,
            [...initialValues, ...createItems('merge growth', 200)]
        );
        registerAlternatingMerge(
            `merge 1,000 ${collectionType} entries to an interleaved one-third subsequence and back`,
            initialValues.filter((_, index) => index % 3 === 0)
        );
        registerAlternatingMerge(`merge between 1,000 and zero ${collectionType} entries`, []);
    });
}

describe('initial HTML rendering', () => {
    for (const size of [100, 1_000]) {
        const staticElements = createStaticElements(size);
        bench(`mount and dispose ${size} static elements`, () => mountForMeasurement(staticElements), benchmarkOptions);

        const componentModels = <ul>{createModels(size)}</ul>;
        bench(`mount and dispose ${size} component elements`, () => mountForMeasurement(componentModels), benchmarkOptions);

        const primitiveCollection = new ArrayDataSource<Renderable>(Array.from({ length: size }, (_, index) => `item ${index}`));
        bench(
            `mount and dispose ArrayDataSource with ${size} primitive entries`,
            () => mountForMeasurement(<div>{primitiveCollection}</div>),
            benchmarkOptions
        );
        const primitiveValues = primitiveCollection.toArray();
        bench(
            `construct, mount, and dispose ArrayDataSource with ${size} primitive entries`,
            () => mountForMeasurement(<div>{new ArrayDataSource<Renderable>(primitiveValues)}</div>),
            benchmarkOptions
        );

        const componentCollection = new ArrayDataSource<Renderable>(createModels(size));
        bench(
            `mount and dispose ArrayDataSource with ${size} component entries`,
            () => mountForMeasurement(<ul>{componentCollection}</ul>),
            benchmarkOptions
        );
        const componentValues = componentCollection.toArray();
        bench(
            `construct, mount, and dispose ArrayDataSource with ${size} component entries`,
            () => mountForMeasurement(<ul>{new ArrayDataSource<Renderable>(componentValues)}</ul>),
            benchmarkOptions
        );
    }
});

const primitiveValues: Renderable[] = Array.from({ length: 1_000 }, (_, index) => `item ${index}`);
const componentValues = createModels(1_000);
const createPrimitiveItems = (prefix: string, count: number): Renderable[] =>
    Array.from({ length: count }, (_, index) => `${prefix} ${index}`);
const createComponentItems = (prefix: string, count: number): Renderable[] =>
    Array.from({ length: count }, (_, index) => <Item label={`${prefix} ${index}`} />);

registerCollectionMutationBenchmarks('primitive', primitiveValues, createPrimitiveItems);
registerCollectionMutationBenchmarks('component', componentValues, createComponentItems);
registerMergeBenchmarks('primitive', primitiveValues, createPrimitiveItems);
registerMergeBenchmarks('component', componentValues, createComponentItems);

function registerDuplicateHeavyMergeBenchmark(collectionType: string, distinctValues: Renderable[]): void {
    describe(`duplicate-heavy ${collectionType} collection merges`, () => {
        const initialValues: Renderable[] = Array.from({ length: 1_000 }, (_, index) => distinctValues[index % distinctValues.length]);
        const rotatedValues = [...initialValues.slice(1), initialValues[0]];
        const source = new ArrayDataSource<Renderable>(initialValues);
        mountPersistent(<div>{source}</div>);
        let rotated = true;

        bench(`merge-rotate 1,000 entries containing only 10 distinct ${collectionType} values`, () => {
            source.merge(rotated ? rotatedValues : initialValues);
            rotated = !rotated;
        }, benchmarkOptions);
    });
}

registerDuplicateHeavyMergeBenchmark('primitive', createPrimitiveItems('duplicate', 10));
registerDuplicateHeavyMergeBenchmark('component-reference', createComponentItems('duplicate component', 10));

describe('reactive component content', () => {
    const labels = Array.from({ length: 1_000 }, (_, index) => new DataSource(`item ${index}`));
    const source = new ArrayDataSource<Renderable>(labels.map((label) => <Item label={label} />));
    mountPersistent(<ul>{source}</ul>);
    let revision = 0;

    bench('update one reactive component among 1,000', () => {
        revision++;
        labels[500].update(`middle ${revision}`);
    }, benchmarkOptions);

    bench('update all 1,000 reactive components', () => {
        revision++;
        for (let index = 0; index < labels.length; index++) labels[index].update(`item ${index} revision ${revision}`);
    }, benchmarkOptions);
});

describe('reactive DOM attributes', () => {
    const titles = Array.from({ length: 1_000 }, (_, index) => new DataSource(`title ${index}`));
    mountPersistent(<div>{titles.map((title) => <span title={title} />)}</div>);
    let revision = 0;

    bench('update one reactive attribute among 1,000', () => {
        revision++;
        titles[500].update(`middle title ${revision}`);
    }, benchmarkOptions);

    bench('update all 1,000 reactive attributes', () => {
        revision++;
        for (let index = 0; index < titles.length; index++) titles[index].update(`title ${index} revision ${revision}`);
    }, benchmarkOptions);
});

describe('range-backed collection mutations', () => {
    const values = Array.from({ length: 1_000 }, (_, index) => new DataSource<Renderable>(`item ${index}`));
    const source = new ArrayDataSource<Renderable>(values);
    mountPersistent(<div>{source}</div>);

    bench('swap and restore distant reactive ranges', () => {
        source.swap(0, source.length.value - 1);
        source.swap(0, source.length.value - 1);
    }, benchmarkOptions);

    let rotated = true;
    const rotatedValues = [...values.slice(1), values[0]];
    bench('merge-rotate 1,000 retained reactive ranges', () => {
        source.merge(rotated ? rotatedValues : values);
        rotated = !rotated;
    }, benchmarkOptions);
});

describe('renderer-neutral tree performance', () => {
    const staticTree = <div>{Array.from({ length: 1_000 }, (_, index) => <span data-value={index}>{index}</span>)}</div>;
    bench('render and dispose a 1,000-element RenderTree', () => {
        renderToTree(staticTree).dispose();
    }, benchmarkOptions);

    const values: Renderable[] = Array.from({ length: 1_000 }, (_, index) => `item ${index}`);
    const reversed = values.slice().reverse();
    const source = new ArrayDataSource<Renderable>(values);
    const tree = renderToTree(source);
    cleanups.push(() => tree.dispose());
    let reverse = true;
    bench('reverse 1,000 retained RenderTree entries', () => {
        source.merge(reverse ? reversed : values);
        reverse = !reverse;
    }, benchmarkOptions);

    const rotated = [...values.slice(1), values[0]];
    const rotationSource = new ArrayDataSource<Renderable>(values);
    const rotationTree = renderToTree(rotationSource);
    cleanups.push(() => rotationTree.dispose());
    let rotate = true;
    bench('rotate 1,000 retained RenderTree entries', () => {
        rotationSource.merge(rotate ? rotated : values);
        rotate = !rotate;
    }, benchmarkOptions);
});

afterAll(() => {
    for (const cleanup of cleanups) cleanup();
});
