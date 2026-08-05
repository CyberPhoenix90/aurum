import { afterEach, assert, describe, it } from 'vitest';
import { ArrayDataSource, Aurum, AurumComponentAPI, CancellationToken, DataSource, Renderable } from '../../src/index.js';

describe('ArrayDataSource rendering identity', () => {
    let attachToken: CancellationToken | undefined;

    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    function renderedElements(): HTMLElement[] {
        return Array.from(document.querySelectorAll<HTMLElement>('#target > div > [data-item]'));
    }

    it('preserves existing DOM nodes when inserting an item', () => {
        const first = <span data-item="first">first</span>;
        const second = <span data-item="second">second</span>;
        const inserted = <span data-item="inserted">inserted</span>;
        const items = new ArrayDataSource<Renderable>([first, second]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));
        const [firstNode, secondNode] = renderedElements();

        items.insertAt(1, inserted);

        const rendered = renderedElements();
        assert.deepEqual(
            rendered.map((node) => node.dataset.item),
            ['first', 'inserted', 'second']
        );
        assert.strictEqual(rendered[0], firstNode);
        assert.strictEqual(rendered[2], secondNode);
    });

    it('moves existing DOM nodes when swapping items', () => {
        const items = new ArrayDataSource<Renderable>([
            <span data-item="first">first</span>,
            <span data-item="second">second</span>,
            <span data-item="third">third</span>
        ]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));
        const [firstNode, secondNode, thirdNode] = renderedElements();

        items.swap(0, 2);

        const rendered = renderedElements();
        assert.deepEqual(
            rendered.map((node) => node.dataset.item),
            ['third', 'second', 'first']
        );
        assert.strictEqual(rendered[0], thirdNode);
        assert.strictEqual(rendered[1], secondNode);
        assert.strictEqual(rendered[2], firstNode);
    });

    it('does not allocate range markers for ordinary single-root items', () => {
        const items = new ArrayDataSource<Renderable>([
            <span data-item="first">first</span>,
            <span data-item="second">second</span>,
            <span data-item="third">third</span>
        ]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));

        const container = document.querySelector('#target > div');
        const comments = Array.from(container.childNodes).filter((node) => node instanceof Comment);
        assert.lengthOf(comments, 2);
    });

    it('swaps distant single-root items with a constant number of DOM insertions', () => {
        const values = Array.from({ length: 200 }, (_, index) => <span data-item={index.toString()}>{index}</span>);
        const items = new ArrayDataSource<Renderable>(values);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));
        const container = document.querySelector<HTMLElement>('#target > div');
        const insertBefore = container.insertBefore.bind(container);
        let insertionCount = 0;
        container.insertBefore = ((newNode: Node, referenceNode: Node | null) => {
            insertionCount++;
            return insertBefore(newNode, referenceNode);
        }) as typeof container.insertBefore;

        try {
            items.swap(10, 190);
        } finally {
            container.insertBefore = insertBefore;
        }

        assert.equal(insertionCount, 2);
        const rendered = renderedElements();
        assert.equal(rendered[10].dataset.item, '190');
        assert.equal(rendered[190].dataset.item, '10');
    });

    it('preserves identity for retained values during a merge', () => {
        const first = <span data-item="first">first</span>;
        const second = <span data-item="second">second</span>;
        const third = <span data-item="third">third</span>;
        const added = <span data-item="added">added</span>;
        const items = new ArrayDataSource<Renderable>([first, second, third]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));
        const [firstNode, secondNode, thirdNode] = renderedElements();

        items.merge([third, added, first]);

        const rendered = renderedElements();
        assert.deepEqual(
            rendered.map((node) => node.dataset.item),
            ['third', 'added', 'first']
        );
        assert.strictEqual(rendered[0], thirdNode);
        assert.notStrictEqual(rendered[1], secondNode);
        assert.strictEqual(rendered[2], firstNode);
        assert.isFalse(secondNode.isConnected);
    });

    it('matches duplicate references by occurrence order during a merge', () => {
        const duplicate = <span data-item="duplicate">duplicate</span>;
        const other = <span data-item="other">other</span>;
        const items = new ArrayDataSource<Renderable>([duplicate, duplicate, other]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));
        const [firstDuplicateNode, secondDuplicateNode, otherNode] = renderedElements();

        items.merge([duplicate, other]);

        const rendered = renderedElements();
        assert.deepEqual(
            rendered.map((node) => node.dataset.item),
            ['duplicate', 'other']
        );
        assert.strictEqual(rendered[0], firstDuplicateNode);
        assert.strictEqual(rendered[1], otherNode);
        assert.isFalse(secondDuplicateNode.isConnected);
    });

    it('gives a removed value a new rendered identity when it is inserted again', () => {
        const item = <span data-item="item">item</span>;
        const items = new ArrayDataSource<Renderable>([item]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));
        const originalNode = renderedElements()[0];

        items.removeAt(0);
        assert.isFalse(originalNode.isConnected);

        items.push(item);

        const replacementNode = renderedElements()[0];
        assert.notStrictEqual(replacementNode, originalNode);
        assert.equal(replacementNode.dataset.item, 'item');
    });

    it('replaces only the targeted item and preserves its neighbors', () => {
        const items = new ArrayDataSource<Renderable>([
            <span data-item="first">first</span>,
            <span data-item="second">second</span>,
            <span data-item="third">third</span>
        ]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));
        const [firstNode, secondNode, thirdNode] = renderedElements();

        items.set(1, <span data-item="replacement">replacement</span>);

        const rendered = renderedElements();
        assert.strictEqual(rendered[0], firstNode);
        assert.notStrictEqual(rendered[1], secondNode);
        assert.strictEqual(rendered[2], thirdNode);
        assert.isFalse(secondNode.isConnected);
    });

    it('disposes only the removed component session', () => {
        const attached: string[] = [];
        const detached: string[] = [];

        function Item(props: { name: string }, _children: Renderable[], api: AurumComponentAPI) {
            api.onAttach(() => attached.push(props.name));
            api.onDetach(() => detached.push(props.name));
            return <span data-item={props.name}>{props.name}</span>;
        }

        const first = <Item name="first" />;
        const second = <Item name="second" />;
        const third = <Item name="third" />;
        const items = new ArrayDataSource<Renderable>([first, second, third]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));
        const [firstNode, , thirdNode] = renderedElements();
        assert.sameMembers(attached, ['first', 'second', 'third']);

        items.removeAt(1);

        const rendered = renderedElements();
        assert.deepEqual(detached, ['second']);
        assert.strictEqual(rendered[0], firstNode);
        assert.strictEqual(rendered[1], thirdNode);
    });

    it('fires entry attach callbacks after all sibling ranges are populated', () => {
        const observedContent: string[] = [];

        function Item(props: { name: string }, _children: Renderable[], api: AurumComponentAPI) {
            api.onAttach(() => observedContent.push(document.querySelector('#target > div').textContent));
            return <span data-item={props.name}>{props.name}</span>;
        }

        const items = new ArrayDataSource<Renderable>([<Item name="first" />, <Item name="second" />]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));

        assert.deepEqual(observedContent, ['firstsecond', 'firstsecond']);
    });

    it('moves a comment-bounded dynamic range as one item and keeps it reactive', () => {
        // Dynamic sources support multi-root values at runtime even though Renderable's
        // public type currently describes only a singular resolved value.
        const first = new DataSource<any>([
            <span data-item="first-a">first-a</span>,
            <span data-item="first-b">first-b</span>
        ]);
        const second = new DataSource<any>([
            <span data-item="second-a">second-a</span>,
            <span data-item="second-b">second-b</span>
        ]);
        const items = new ArrayDataSource<any>([first, second]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));
        const initial = renderedElements();

        items.swap(0, 1);

        let rendered = renderedElements();
        assert.deepEqual(
            rendered.map((node) => node.dataset.item),
            ['second-a', 'second-b', 'first-a', 'first-b']
        );
        assert.strictEqual(rendered[0], initial[2]);
        assert.strictEqual(rendered[1], initial[3]);
        assert.strictEqual(rendered[2], initial[0]);
        assert.strictEqual(rendered[3], initial[1]);

        second.update([<span data-item="second-updated">second-updated</span>]);

        rendered = renderedElements();
        assert.deepEqual(
            rendered.map((node) => node.dataset.item),
            ['second-updated', 'first-a', 'first-b']
        );
        assert.strictEqual(rendered[1], initial[0]);
        assert.strictEqual(rendered[2], initial[1]);
    });

    it('assigns one movable identity to each static multi-root item', () => {
        const first = [
            <span data-item="first-a">first-a</span>,
            <span data-item="first-b">first-b</span>
        ];
        const second = [
            <span data-item="second-a">second-a</span>,
            <span data-item="second-b">second-b</span>
        ];
        const items = new ArrayDataSource<any>([first, second]);

        attachToken = Aurum.attach(<div>{items}</div>, document.getElementById('target'));
        const initial = renderedElements();

        items.swap(0, 1);

        const rendered = renderedElements();
        assert.deepEqual(
            rendered.map((node) => node.dataset.item),
            ['second-a', 'second-b', 'first-a', 'first-b']
        );
        assert.strictEqual(rendered[0], initial[2]);
        assert.strictEqual(rendered[1], initial[3]);
        assert.strictEqual(rendered[2], initial[0]);
        assert.strictEqual(rendered[3], initial[1]);
    });
});
