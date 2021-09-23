import { assert } from 'chai';
import { ArrayDataSource, CancellationToken, TreeDataSource } from '../../src/aurumjs';

describe('TreeDatasource', () => {
    let attachToken: CancellationToken;

    const dynamicNode: ArrayDataSource<Tree> = new ArrayDataSource([
        {
            id: '4',
            children: []
        } as Tree
    ]);
    type Tree = { id: string; children: Tree[] | ArrayDataSource<Tree> };

    const tree: Tree[] = [
        {
            id: '1',
            children: [
                {
                    id: '1.1',
                    children: [
                        {
                            id: '3',
                            children: [
                                {
                                    id: '5',
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    id: '2',
                    children: dynamicNode
                }
            ]
        }
    ];

    beforeEach(() => {
        attachToken = new CancellationToken();
    });

    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
    });

    it('should list all nodes', () => {
        const a = new TreeDataSource('children', tree);
        assert.deepEqual(
            a
                .createArrayDataSourceOfNodes(attachToken)
                .toArray()
                .map((e) => e.id),
            ['1', '1.1', '3', '5', '2', '4']
        );
    });

    it('iterate nodes', () => {
        const a = new TreeDataSource('children', tree);
        assert.deepEqual(
            Array.from(a).map((e) => e.id),
            ['1', '1.1', '3', '5', '2', '4']
        );
    });

    it('map nodes', () => {
        const a = new TreeDataSource('children', tree);
        const mapped = a.map((i) => ({ n: i.id, children: i.children }));
        assert.deepEqual(
            Array.from(mapped).map((e) => e.n),
            ['1', '1.1', '3', '5', '2', '4']
        );

        dynamicNode.push({
            id: '6',
            children: []
        });

        assert.deepEqual(
            Array.from(mapped).map((e) => e.n),
            ['1', '1.1', '3', '5', '2', '4', '6']
        );
    });

    it('should allow listening to changes', () => {
        const a = new TreeDataSource<Tree, 'children'>('children', tree);
        const changes = [];

        a.listen(
            (e) =>
                changes.push({
                    operation: e.operation,
                    id: e.changedNode.id
                }),
            attachToken
        );

        const dynamicNode2 = new ArrayDataSource<Tree>([]);
        const dynamicNode3 = new ArrayDataSource<Tree>([]);

        dynamicNode.push({
            id: '7',
            children: []
        });
        dynamicNode.push({
            id: '8',
            children: dynamicNode2
        });
        dynamicNode.removeAt(1);
        dynamicNode2.push({
            id: '9',
            children: dynamicNode3
        });

        dynamicNode3.push({
            id: '10',
            children: []
        });
        dynamicNode2.clear();
        dynamicNode3.push({
            id: '11',
            children: []
        });

        assert.deepEqual(changes, [
            { operation: 'added', id: '7' },
            { operation: 'added', id: '8' },
            { operation: 'deleted', id: '6' },
            { operation: 'added', id: '9' },
            { operation: 'added', id: '10' },
            { operation: 'deleted', id: '9' }
        ]);
    });
});
