import { ArrayDataSource, CancellationToken, DataSource } from 'aurumjs';
import { assert } from 'chai';
import { BasicLayout } from '../src/layouts/basic_layout';
import { DynamicLayout } from '../src/layouts/dynamic_layout';
import { LayoutEngine } from '../src/layout_engine';
import { LayoutElementTreeNode } from '../src/model';

describe('basic layout', () => {
    it('Create basic layout', () => {
        assert(new BasicLayout());
    });

    it('Basic Layout with no children', () => {
        const node = createLayoutNode();
        const le = new LayoutEngine(node, new CancellationToken());
        le.onReflow.subscribe(() => {
            assert.fail('Should not be called');
        });
        const nodeLayout = le.getLayoutDataFor(node);

        assert(nodeLayout.x.value === 0);
        assert(nodeLayout.y.value === 0);
        assert(nodeLayout.innerWidth.value === 0);
        assert(nodeLayout.outerWidth.value === 0);
        assert(nodeLayout.innerHeight.value === 0);
        assert(nodeLayout.outerHeight.value === 0);

        node.x.update(2);
        node.y.update(3);
        node.width.update(4);
        node.height.update(5);

        assert(nodeLayout.x.value === 2);
        assert(nodeLayout.y.value === 3);
        assert(nodeLayout.innerWidth.value === 4);
        assert(nodeLayout.outerWidth.value === 4);
    });

    it('Basic Layout with one child', () => {
        const node = createLayoutNode();
        const child = createLayoutNode();
        child.parent.update(node);
        node.children.push(child);
        const le = new LayoutEngine(node, new CancellationToken());
        le.onReflow.subscribe(() => {
            assert.fail('Should not be called');
        });
        const nodeLayout = le.getLayoutDataFor(node);
        assert(nodeLayout.x.value === 0);
        assert(nodeLayout.y.value === 0);
        assert(nodeLayout.innerWidth.value === 0);
        assert(nodeLayout.outerWidth.value === 0);
        assert(nodeLayout.innerHeight.value === 0);
        assert(nodeLayout.outerHeight.value === 0);
        const childLayout = le.getLayoutDataFor(child);
        assert(childLayout.x.value === 0);
        assert(childLayout.y.value === 0);
        assert(childLayout.innerWidth.value === 0);
        assert(childLayout.outerWidth.value === 0);
        assert(childLayout.innerHeight.value === 0);
        assert(childLayout.outerHeight.value === 0);

        node.x.update(2);
        node.y.update(3);
        node.width.update(4);
        node.height.update(5);

        assert(nodeLayout.x.value === 2);
        assert(nodeLayout.y.value === 3);
        assert(nodeLayout.innerWidth.value === 4);
        assert(nodeLayout.outerWidth.value === 4);
        assert(nodeLayout.innerHeight.value === 5);
        assert(nodeLayout.outerHeight.value === 5);
        assert(childLayout.x.value === 0);
        assert(childLayout.y.value === 0);
        assert(childLayout.innerWidth.value === 0);
        assert(childLayout.outerWidth.value === 0);
        assert(childLayout.innerHeight.value === 0);
        assert(childLayout.outerHeight.value === 0);
    });
});
describe('dynamic layout', () => {
    it('Dynamic Layout with no children', () => {
        return new Promise<void>((resolve, reject) => {
            const node = createLayoutNode();
            const le = new LayoutEngine(node, new CancellationToken(), new DynamicLayout());
            le.onReflowEnd.subscribe((stats) => {
                console.log(stats);
                assert(nodeLayout.x.value === 2);
                assert(nodeLayout.y.value === 0);
                assert(nodeLayout.innerWidth.value === 4);
                assert(nodeLayout.outerWidth.value === 4);
                assert(nodeLayout.innerHeight.value === 5);
                assert(nodeLayout.outerHeight.value === 5);
                resolve();
            });
            const nodeLayout = le.getLayoutDataFor(node);

            assert(nodeLayout.x.value === 0);
            assert(nodeLayout.y.value === 0);
            assert(nodeLayout.innerWidth.value === 0);
            assert(nodeLayout.outerWidth.value === 0);
            assert(nodeLayout.innerHeight.value === 0);
            assert(nodeLayout.outerHeight.value === 0);

            node.x.update('2px');
            node.y.update('30%');
            node.width.update(4);
            node.height.update(5);
        });
    });

    it('Dynamic Layout with one child', () => {
        return new Promise<void>((resolve, reject) => {
            const node = createLayoutNode();
            const child = createLayoutNode();
            child.parent.update(node);
            node.children.push(child);
            const le = new LayoutEngine(node, new CancellationToken(), new DynamicLayout());
            le.onReflowEnd.subscribeOnce((stats) => {
                assert.equal(nodeLayout.x.value, 20);
                assert.equal(nodeLayout.y.value, 300);
                assert.equal(childLayout.x.value, 0);
                assert.equal(childLayout.y.value, 0);
                assert.equal(childLayout.innerWidth.value, 20);
                assert.equal(childLayout.outerWidth.value, 20);
                assert.equal(childLayout.innerHeight.value, 50);
                assert.equal(childLayout.outerHeight.value, 50);

                le.onReflowEnd.subscribeOnce((stats) => {
                    assert.equal(childLayout.innerWidth.value, 50);
                    assert.equal(childLayout.outerWidth.value, 50);
                });
                node.width.update('100px');

                resolve();
            });
            const nodeLayout = le.getLayoutDataFor(node);
            const childLayout = le.getLayoutDataFor(child);

            assert(nodeLayout.x.value === 0);
            assert(nodeLayout.y.value === 0);
            assert(nodeLayout.innerWidth.value === 0);
            assert(nodeLayout.outerWidth.value === 0);
            assert(nodeLayout.innerHeight.value === 0);
            assert(nodeLayout.outerHeight.value === 0);
            assert(childLayout.x.value === 0);
            assert(childLayout.y.value === 0);
            assert(childLayout.innerWidth.value === 0);
            assert(childLayout.outerWidth.value === 0);
            assert(childLayout.innerHeight.value === 0);
            assert(childLayout.outerHeight.value === 0);

            node.x.update('20px');
            node.y.update(300);
            node.width.update('40px');
            node.height.update(200);
            child.width.update('50%');
            child.height.update('25%');
        });
    });

    it('Dynamic Layout with two children', () => {
        return new Promise<void>((resolve, reject) => {
            const node = createLayoutNode();
            const child = createLayoutNode();
            const child2 = createLayoutNode();

            child.parent.update(node);
            child2.parent.update(node);
            node.children.push(child);
            node.children.push(child2);

            const le = new LayoutEngine(node, new CancellationToken(), new DynamicLayout());
            le.onReflowEnd.subscribeOnce((stats) => {
                assert.equal(childLayout.innerWidth.value, 40);
                assert.equal(childLayout.innerHeight.value, 100);
                assert.equal(child2Layout.innerWidth.value, 60);
                assert.equal(child2Layout.innerHeight.value, 100);

                resolve();
            });
            const childLayout = le.getLayoutDataFor(child);
            const child2Layout = le.getLayoutDataFor(child2);

            node.x.update(20);
            node.y.update(30);
            node.width.update(200);
            node.height.update(400);

            child.width.update('20%');
            child.height.update('25%');

            child2.width.update('30%');
            child2.height.update('25%');
        });
    });

    it('Dynamic Layout with a child with margin', () => {
        return new Promise<void>((resolve, reject) => {
            const node = createLayoutNode();
            const child = createLayoutNode();
            const child2 = createLayoutNode();
            child.parent.update(node);
            child2.parent.update(child);
            child.children.push(child2);
            node.children.push(child);
            const le = new LayoutEngine(node, new CancellationToken(), new DynamicLayout());
            le.onReflowEnd.subscribeOnce((stats) => {
                assert.equal(childLayout.innerWidth.value, 40);
                assert.equal(childLayout.outerWidth.value, 50);
                assert.equal(child2Layout.x.value, 10);

                resolve();
            });
            const childLayout = le.getLayoutDataFor(child);
            const child2Layout = le.getLayoutDataFor(child2);

            node.x.update(20);
            node.y.update(30);
            node.width.update(200);
            node.height.update(400);

            child.width.update('20%');
            child.height.update('25%');
            child.marginLeft.update(10);
        });
    });
});

function createLayoutNode(): LayoutElementTreeNode {
    return {
        x: new DataSource(0),
        y: new DataSource(0),
        layout: new DataSource(undefined),
        width: new DataSource(0),
        height: new DataSource(0),
        parent: new DataSource(undefined),
        children: new ArrayDataSource([]),
        marginTop: new DataSource(0),
        marginRight: new DataSource(0),
        marginBottom: new DataSource(0),
        marginLeft: new DataSource(0),
        originX: new DataSource(0),
        originY: new DataSource(0)
    };
}
